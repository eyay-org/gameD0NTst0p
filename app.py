"""
Flask Backend API for Game Store
Provides RESTful endpoints for frontend
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import os
from dotenv import load_dotenv
from datetime import datetime
import hashlib
import math
import random
import string

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASS', ''),
    'database': os.getenv('DB_NAME', 'oyun_satis_db'),
    'port': int(os.getenv('DB_PORT', 3306))
}


def get_db_connection():
    """Create and return database connection"""
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None


def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


# ============================================================================
# PRODUCT ENDPOINTS
# ============================================================================

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products with optional filters"""
    try:
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor(dictionary=True)
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 24, type=int)
        search = request.args.get('search', '')
        product_type = request.args.get('type', '')
        genre = request.args.get('genre', '')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        sort_by = request.args.get('sort_by', 'newest')
        platform = request.args.get('platform', '')
        min_rating = request.args.get('min_rating', type=float)
        multiplayer = request.args.get('multiplayer') == 'true'
        
        offset = (page - 1) * limit
        
        # Base Joins
        joins = """
            LEFT JOIN PRODUCT_MEDIA pm ON p.product_id = pm.product_id AND pm.main_image = TRUE
            LEFT JOIN REVIEW r ON p.product_id = r.product_id
            LEFT JOIN GAME gm ON p.product_id = gm.product_id
            LEFT JOIN CONSOLE c ON p.product_id = c.product_id
        """
        
        if genre:
            joins += """
                JOIN GAME_GENRE gg ON p.product_id = gg.product_id
                JOIN GENRE g ON gg.genre_id = g.genre_id
            """
            
        # Base Where Clause
        where_clause = " WHERE 1=1"
        params = []
        
        # Apply filters
        if product_type:
            where_clause += " AND p.product_type = %s"
            params.append(product_type)
            
        if genre:
            where_clause += " AND g.genre_name = %s"
            params.append(genre)
            
        if platform:
            if product_type == 'console':
                where_clause += " AND (c.model LIKE %s OR c.manufacturer LIKE %s)"
                params.extend([f'%{platform}%', f'%{platform}%'])
            else:
                # If filtering by platform and not explicitly looking for consoles, show games
                if not product_type:
                    where_clause += " AND p.product_type = 'game'"
                
                # Use REGEXP for exact match in comma-separated list
                # Matches: Start or comma + Platform + End or comma
                where_clause += " AND gm.platform REGEXP %s"
                params.append(f'(^|, ){platform}($|,)')
            
        if multiplayer:
            where_clause += " AND gm.multiplayer = TRUE"
        
        if search:
            where_clause += " AND p.product_name LIKE %s"
            params.append(f'%{search}%')
            
        if min_price is not None:
            where_clause += " AND p.price >= %s"
            params.append(min_price)
            
        if max_price is not None:
            where_clause += " AND p.price <= %s"
            params.append(max_price)

        # --- COUNT QUERY ---
        if min_rating:
            # For min_rating, we need to group and check HAVING, so we use a subquery
            count_query = f"""
                SELECT COUNT(*) as total FROM (
                    SELECT p.product_id, COALESCE(AVG(r.rating), 0) as avg_rating
                    FROM PRODUCT p
                    {joins}
                    {where_clause}
                    GROUP BY p.product_id
                    HAVING avg_rating >= %s
                ) as sub
            """
            count_params = params + [min_rating]
        else:
            # Standard count
            count_query = f"""
                SELECT COUNT(DISTINCT p.product_id) as total
                FROM PRODUCT p
                {joins}
                {where_clause}
            """
            count_params = params

        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()['total']
        total_pages = math.ceil(total_count / limit)

        # --- DATA QUERY ---
        query = f"""
            SELECT p.product_id, p.product_name, p.price, p.product_type, p.release_date,
                   MAX(pm.media_url) as main_image,
                   COALESCE(AVG(r.rating), 0) as avg_rating
            FROM PRODUCT p
            {joins}
            {where_clause}
            GROUP BY p.product_id
        """
        
        # Filter by rating (HAVING clause after GROUP BY)
        if min_rating:
            query += " HAVING avg_rating >= %s"
            params.append(min_rating)
        
        # Apply sorting
        if sort_by == 'price_asc':
            query += " ORDER BY p.price ASC"
        elif sort_by == 'price_desc':
            query += " ORDER BY p.price DESC"
        elif sort_by == 'name_asc':
            query += " ORDER BY p.product_name ASC"
        elif sort_by == 'rating_desc':
            query += " ORDER BY avg_rating DESC"
        elif sort_by == 'rating_asc':
            query += " ORDER BY avg_rating ASC"
        elif sort_by == 'oldest':
            query += " ORDER BY p.release_date ASC"
        else:  # newest (default)
            query += " ORDER BY p.release_date DESC"
            
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        products = cursor.fetchall()
        
        # Get additional details for games
        for product in products:
            if product['product_type'] == 'game':
                cursor.execute("""
                    SELECT platform, developer, publisher, ESRB_rating, multiplayer
                    FROM GAME WHERE product_id = %s
                """, (product['product_id'],))
                game_info = cursor.fetchone()
                if game_info:
                    product.update(game_info)
                
                # Get genres
                cursor.execute("""
                    SELECT g.genre_name
                    FROM GAME_GENRE gg
                    JOIN GENRE g ON gg.genre_id = g.genre_id
                    WHERE gg.product_id = %s
                """, (product['product_id'],))
                product['genres'] = [row['genre_name'] for row in cursor.fetchall()]
            
            elif product['product_type'] == 'console':
                cursor.execute("""
                    SELECT manufacturer, model, storage_capacity, color
                    FROM CONSOLE WHERE product_id = %s
                """, (product['product_id'],))
                console_info = cursor.fetchone()
                if console_info:
                    product.update(console_info)
        
        cursor.close()
        cnx.close()
        
        return jsonify({
            'products': products,
            'total_count': total_count,
            'total_pages': total_pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product details"""
    try:
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor(dictionary=True)
        
        # Get product
        cursor.execute("""
            SELECT 
                p.*,
                pm.media_url as main_image
            FROM PRODUCT p
            LEFT JOIN PRODUCT_MEDIA pm ON p.product_id = pm.product_id AND pm.main_image = TRUE
            WHERE p.product_id = %s
        """, (product_id,))
        product = cursor.fetchone()
        
        if not product:
            cursor.close()
            cnx.close()
            return jsonify({'error': 'Product not found'}), 404
        
        # Get all media
        cursor.execute("""
            SELECT media_type, media_url, order_no
            FROM PRODUCT_MEDIA
            WHERE product_id = %s
            ORDER BY order_no
        """, (product_id,))
        product['media'] = cursor.fetchall()
        
        # Get game or console details
        if product['product_type'] == 'game':
            cursor.execute("SELECT * FROM GAME WHERE product_id = %s", (product_id,))
            game_info = cursor.fetchone()
            if game_info:
                product.update(game_info)
            
            # Get genres
            cursor.execute("""
                SELECT g.genre_id, g.genre_name
                FROM GAME_GENRE gg
                JOIN GENRE g ON gg.genre_id = g.genre_id
                WHERE gg.product_id = %s
            """, (product_id,))
            product['genres'] = cursor.fetchall()
        
        elif product['product_type'] == 'console':
            cursor.execute("SELECT * FROM CONSOLE WHERE product_id = %s", (product_id,))
            console_info = cursor.fetchone()
            if console_info:
                product.update(console_info)
        
        # Get reviews
        cursor.execute("""
            SELECT 
                r.review_id,
                r.rating,
                r.review_title,
                r.review_text,
                r.review_date,
                r.helpful_count,
                c.first_name,
                c.last_name
            FROM REVIEW r
            LEFT JOIN CUSTOMER c ON r.customer_id = c.customer_id
            WHERE r.product_id = %s AND r.approved = TRUE
            ORDER BY r.review_date DESC
        """, (product_id,))
        product['reviews'] = cursor.fetchall()

        # Get Inventory Data (Total Stock & Branch Availability)
        cursor.execute("""
            SELECT b.branch_name, i.quantity
            FROM INVENTORY i
            JOIN BRANCH b ON i.branch_id = b.branch_id
            WHERE i.product_id = %s AND i.quantity > 0
        """, (product_id,))
        inventory_rows = cursor.fetchall()
        
        product['total_stock'] = sum(row['quantity'] for row in inventory_rows) if inventory_rows else 0
        product['available_at'] = [row['branch_name'] for row in inventory_rows] if inventory_rows else []
        
        cursor.close()
        cnx.close()
        
        return jsonify(product), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/genres', methods=['GET'])
def get_genres():
    """Get all genres"""
    try:
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("SELECT genre_id, genre_name, description FROM GENRE ORDER BY genre_name")
        genres = cursor.fetchall()
        
        cursor.close()
        cnx.close()
        
        return jsonify(genres), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/platforms', methods=['GET'])
def get_platforms():
    """Get all unique platforms from games"""
    try:
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("SELECT DISTINCT platform FROM GAME")
        rows = cursor.fetchall()
        
        # Process comma-separated platforms
        unique_platforms = set()
        for row in rows:
            if row['platform']:
                # Split by comma and strip whitespace
                platforms = [p.strip() for p in row['platform'].split(',')]
                unique_platforms.update(platforms)
        
        # Sort alphabetically
        sorted_platforms = sorted(list(unique_platforms))
        
        cursor.close()
        cnx.close()
        
        return jsonify(sorted_platforms), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# CUSTOMER ENDPOINTS
# ============================================================================

@app.route('/api/customers/register', methods=['POST'])
def register_customer():
    """Register a new customer"""
    try:
        data = request.json
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor()
        
        # Check if email exists
        cursor.execute("SELECT customer_id FROM CUSTOMER WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            cursor.close()
            cnx.close()
            return jsonify({'error': 'Email already exists'}), 400
        
        # Insert customer
        cursor.execute("""
            INSERT INTO CUSTOMER (first_name, last_name, email, password_hash, phone, registration_date)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data['first_name'],
            data['last_name'],
            data['email'],
            hash_password(data['password']),
            data.get('phone'),
            datetime.now().date()
        ))
        
        customer_id = cursor.lastrowid
        cnx.commit()
        cursor.close()
        cnx.close()
        
        return jsonify({'customer_id': customer_id, 'message': 'Registration successful'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/customers/login', methods=['POST'])
def login_customer():
    """Login customer"""
    try:
        data = request.json
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor(dictionary=True)
        
        password_hash = hash_password(data['password'])
        cursor.execute("""
            SELECT customer_id, first_name, last_name, email, active_status, is_admin
            FROM CUSTOMER
            WHERE email = %s AND password_hash = %s
        """, (data['email'], password_hash))
        
        customer = cursor.fetchone()
        
        if not customer or not customer['active_status']:
            cursor.close()
            cnx.close()
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Update last login
        cursor.execute("""
            UPDATE CUSTOMER SET last_login_date = NOW() WHERE customer_id = %s
        """, (customer['customer_id'],))
        cnx.commit()
        
        cursor.close()
        cnx.close()
        
        return jsonify({
            'customer_id': customer['customer_id'],
            'first_name': customer['first_name'],
            'last_name': customer['last_name'],
            'email': customer['email'],
            'is_admin': bool(customer['is_admin'])
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    """Get dashboard statistics"""
    try:
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor(dictionary=True)
        
        # Total Sales
        cursor.execute("SELECT SUM(total_amount) as total_sales FROM `ORDER` WHERE order_status != 'cancelled'")
        total_sales = cursor.fetchone()['total_sales'] or 0
        
        # Total Orders
        cursor.execute("SELECT COUNT(*) as total_orders FROM `ORDER`")
        total_orders = cursor.fetchone()['total_orders']
        
        # Total Products
        cursor.execute("SELECT COUNT(*) as total_products FROM PRODUCT")
        total_products = cursor.fetchone()['total_products']
        
        # Low Stock Count (Products with stock < alert level in any branch)
        cursor.execute("""
            SELECT COUNT(DISTINCT p.product_id) as low_stock_count
            FROM PRODUCT p
            JOIN INVENTORY i ON p.product_id = i.product_id
            WHERE i.quantity <= p.stock_alert_level
        """)
        low_stock_count = cursor.fetchone()['low_stock_count']
        
        cursor.close()
        cnx.close()
        
        return jsonify({
            'total_sales': float(total_sales),
            'total_orders': total_orders,
            'total_products': total_products,
            'low_stock_count': low_stock_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/inventory', methods=['GET'])
def get_admin_inventory():
    """Get inventory with pagination and sorting"""
    try:
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor(dictionary=True)
        
        # Pagination & Sorting Params
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        sort_by = request.args.get('sort_by', 'product_name')
        order = request.args.get('order', 'asc')
        
        offset = (page - 1) * limit
        
        # Column Mapping for Security
        sort_mapping = {
            'product_name': 'p.product_name',
            'branch_name': 'b.branch_name',
            'quantity': 'i.quantity',
            'last_update': 'i.last_update_date'
        }
        
        sort_column = sort_mapping.get(sort_by, 'p.product_name')
        sort_direction = 'DESC' if order == 'desc' else 'ASC'
        
        # Count Query
        cursor.execute("SELECT COUNT(*) as total FROM INVENTORY")
        total_count = cursor.fetchone()['total']
        total_pages = math.ceil(total_count / limit)
        
        # Data Query
        query = f"""
            SELECT 
                p.product_id,
                p.product_name,
                p.stock_alert_level,
                b.branch_name,
                i.quantity,
                i.last_update_date
            FROM INVENTORY i
            JOIN PRODUCT p ON i.product_id = p.product_id
            JOIN BRANCH b ON i.branch_id = b.branch_id
            ORDER BY {sort_column} {sort_direction}
            LIMIT %s OFFSET %s
        """
        
        cursor.execute(query, (limit, offset))
        inventory = cursor.fetchall()
        
        cursor.close()
        cnx.close()
        
        return jsonify({
            'data': inventory,
            'total': total_count,
            'pages': total_pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/orders', methods=['GET'])
def get_admin_orders():
    """Get all orders for admin with pagination and sorting using VIEW"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        sort_by = request.args.get('sort_by', 'order_date')
        order = request.args.get('order', 'desc')
        
        offset = (page - 1) * limit
        
        # Validate sort column to prevent SQL injection
        # Validate sort column to prevent SQL injection
        sort_mapping = {
            'id': 'order_id',          # Fixes the bug
            'order_id': 'order_id',    # Safety
            'customer': 'customer_name',
            'email': 'email',
            'date': 'order_date',
            'total': 'total_amount',
            'status': 'order_status'
        }
        
        sort_column = sort_mapping.get(sort_by, 'order_date')
        if order.lower() not in ['asc', 'desc']:
            order = 'desc'

        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor(dictionary=True)
        
        # 1. Get Total Count
        cursor.execute("SELECT COUNT(*) as total FROM VIEW_ORDER_SUMMARY")
        total_records = cursor.fetchone()['total']
        total_pages = math.ceil(total_records / limit)
        
        # 2. Get Paginated Data from VIEW
        query = f"""
            SELECT *
            FROM VIEW_ORDER_SUMMARY
            ORDER BY {sort_column} {order}
            LIMIT %s OFFSET %s
        """
        
        cursor.execute(query, (limit, offset))
        orders = cursor.fetchall()
        
        cursor.close()
        cnx.close()
        
        return jsonify({
            'data': orders,
            'total': total_records,
            'pages': total_pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/stock-logs', methods=['GET'])
def get_stock_logs():
    cursor = None
    try:
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
            
        cursor = cnx.cursor()
        
        # Join STOCK_LOG with PRODUCT and BRANCH to get readable names
        query = """
            SELECT 
                l.log_id, 
                p.product_name, 
                b.branch_name, 
                l.old_quantity, 
                l.new_quantity, 
                l.change_date
            FROM STOCK_LOG l
            JOIN PRODUCT p ON l.product_id = p.product_id
            JOIN BRANCH b ON l.branch_id = b.branch_id
            ORDER BY l.change_date DESC
            LIMIT 50
        """
        
        cursor.execute(query)
        logs = cursor.fetchall()
        
        # Map to dictionary (Ensure keys match Frontend expectations)
        log_list = []
        for log in logs:
            log_list.append({
                'log_id': log[0],
                'product_name': log[1],
                'branch_name': log[2],
                'old_quantity': log[3],
                'new_quantity': log[4],
                'change_date': log[5]
            })
            
        return jsonify({'success': True, 'logs': log_list}), 200

    except Exception as e:
        print(f"Error fetching stock logs: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if 'cnx' in locals() and cnx:
            cnx.close()


# ============================================================================
# CART ENDPOINTS
# ============================================================================

@app.route('/api/cart/<int:customer_id>', methods=['GET'])
def get_cart(customer_id):
    """Get customer cart"""
    try:
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                c.product_id,
                c.quantity,
                c.added_date,
                p.product_name,
                p.price,
                p.product_type,
                pm.media_url as image
            FROM CART c
            JOIN PRODUCT p ON c.product_id = p.product_id
            LEFT JOIN PRODUCT_MEDIA pm ON p.product_id = pm.product_id AND pm.main_image = TRUE
            WHERE c.customer_id = %s
        """, (customer_id,))
        
        cart_items = cursor.fetchall()
        cursor.close()
        cnx.close()
        
        return jsonify(cart_items), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    """Add item to cart"""
    try:
        data = request.json
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor()
        
        # Check if item already in cart
        cursor.execute("""
            SELECT quantity FROM CART 
            WHERE customer_id = %s AND product_id = %s
        """, (data['customer_id'], data['product_id']))
        
        existing = cursor.fetchone()
        
        if existing:
            # Update quantity
            new_quantity = existing[0] + data.get('quantity', 1)
            cursor.execute("""
                UPDATE CART SET quantity = %s WHERE customer_id = %s AND product_id = %s
            """, (new_quantity, data['customer_id'], data['product_id']))
        else:
            # Insert new item
            cursor.execute("""
                INSERT INTO CART (customer_id, product_id, quantity)
                VALUES (%s, %s, %s)
            """, (data['customer_id'], data['product_id'], data.get('quantity', 1)))
        
        cnx.commit()
        cursor.close()
        cnx.close()
        
        return jsonify({'message': 'Item added to cart'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/cart/<int:customer_id>/<int:product_id>', methods=['DELETE'])
def remove_from_cart(customer_id, product_id):
    """Remove item from cart"""
    try:
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor()
        cursor.execute("""
            DELETE FROM CART WHERE customer_id = %s AND product_id = %s
        """, (customer_id, product_id))
        
        cnx.commit()
        cursor.close()
        cnx.close()
        
        return jsonify({'message': 'Item removed from cart'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ORDER ENDPOINTS
# ============================================================================

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create a new order with inventory management"""
    try:
        data = request.json
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        # Start transaction
        cnx.start_transaction()
        cursor = cnx.cursor()
        
        try:
            # 1. Stock Check & Reservation
            item_branch_map = {} # Map product_id to (branch_id, inventory_id)
            
            for item in data['items']:
                product_id = item['product_id']
                quantity = item['quantity']
                
                # Find branch with highest stock (Load Balancing)
                cursor.execute("""
                    SELECT inventory_id, branch_id, quantity
                    FROM INVENTORY
                    WHERE product_id = %s
                    ORDER BY quantity DESC
                    LIMIT 1
                    FOR UPDATE
                """, (product_id,))
                
                stock_info = cursor.fetchone()
                
                if not stock_info or stock_info[2] < quantity:
                    # Get product name for error message
                    cursor.execute("SELECT product_name FROM PRODUCT WHERE product_id = %s", (product_id,))
                    product_name = cursor.fetchone()[0]
                    raise Exception(f"Out of Stock: {product_name}")
                
                # Store branch info for later use
                item_branch_map[product_id] = {
                    'inventory_id': stock_info[0],
                    'branch_id': stock_info[1]
                }
                
                # 2. Deduct Inventory
                cursor.execute("""
                    UPDATE INVENTORY 
                    SET quantity = quantity - %s 
                    WHERE inventory_id = %s
                """, (quantity, stock_info[0]))

            # Generate Tracking Number
            tracking_number = 'TR' + ''.join(random.choices(string.digits, k=9))

            # 3. Create Order
            cursor.execute("""
                INSERT INTO `ORDER` (
                    customer_id, order_status, total_amount, shipping_fee,
                    payment_method, payment_status, tracking_number,
                    delivery_full_address, delivery_city,
                    billing_full_address, billing_city,
                    order_date
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                data['customer_id'],
                'pending',
                data['total_amount'],
                data.get('shipping_fee', 0),
                data.get('payment_method', 'credit_card'),
                'pending',
                tracking_number,
                data.get('delivery_address', ''),
                data.get('delivery_city', ''),
                data.get('billing_address', ''),
                data.get('billing_city', '')
            ))
            
            order_id = cursor.lastrowid
            
            # 4. Add Order Details and Record Sales
            for item in data['items']:
                product_id = item['product_id']
                branch_info = item_branch_map[product_id]
                
                # Insert Order Detail
                cursor.execute("""
                    INSERT INTO ORDER_DETAIL (order_id, line_no, product_id, quantity, unit_price)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    order_id,
                    item['line_no'],
                    product_id,
                    item['quantity'],
                    item['unit_price']
                ))
                
                # Insert Sale Record
                cursor.execute("""
                    INSERT INTO SALE (order_id, customer_id, branch_id, transaction_date, transaction_amount)
                    VALUES (%s, %s, %s, NOW(), %s)
                """, (
                    order_id,
                    data['customer_id'],
                    branch_info['branch_id'],
                    item['quantity'] * item['unit_price']
                ))
            
            # Clear cart
            cursor.execute("DELETE FROM CART WHERE customer_id = %s", (data['customer_id'],))
            
            cnx.commit()
            return jsonify({'order_id': order_id, 'message': 'Order created successfully'}), 201
            
        except Exception as e:
            cnx.rollback()
            error_msg = str(e)
            if "Out of Stock" in error_msg:
                return jsonify({'error': error_msg}), 400
            raise e
            
    except Exception as e:
        if 'cnx' in locals() and cnx.is_connected():
            cnx.close()
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'cnx' in locals() and cnx.is_connected():
            cnx.close()


@app.route('/api/orders/<int:customer_id>', methods=['GET'])
def get_orders(customer_id):
    """Get customer orders with detailed items"""
    try:
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor(dictionary=True)
        
        # Query to get orders and their items
        query = """
            SELECT 
                o.order_id,
                o.order_date,
                o.order_status,
                o.total_amount,
                o.payment_status,
                o.tracking_number,
                od.product_id,
                od.quantity,
                od.unit_price,
                p.product_name,
                pm.media_url as image_url
            FROM `ORDER` o
            JOIN ORDER_DETAIL od ON o.order_id = od.order_id
            JOIN PRODUCT p ON od.product_id = p.product_id
            LEFT JOIN PRODUCT_MEDIA pm ON p.product_id = pm.product_id AND pm.main_image = TRUE
            WHERE o.customer_id = %s
            ORDER BY o.order_date DESC
        """
        
        cursor.execute(query, (customer_id,))
        rows = cursor.fetchall()
        
        # Group by order_id
        orders_map = {}
        for row in rows:
            order_id = row['order_id']
            if order_id not in orders_map:
                orders_map[order_id] = {
                    'order_id': order_id,
                    'order_date': row['order_date'],
                    'order_status': row['order_status'],
                    'total_amount': float(row['total_amount']),
                    'payment_status': row['payment_status'],
                    'tracking_number': row['tracking_number'],
                    'items': []
                }
            
            orders_map[order_id]['items'].append({
                'product_id': row['product_id'],
                'product_name': row['product_name'],
                'quantity': row['quantity'],
                'unit_price': float(row['unit_price']),
                'image_url': row['image_url']
            })
        
        # Convert map to list and sort by date (descending)
        orders_list = list(orders_map.values())
        orders_list.sort(key=lambda x: x['order_date'], reverse=True)
        
        cursor.close()
        cnx.close()
        
        return jsonify(orders_list), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# REVIEW ENDPOINTS
# ============================================================================

@app.route('/api/reviews', methods=['POST'])
def create_review():
    """Create a product review"""
    try:
        data = request.json
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor()
        cursor.execute("""
            INSERT INTO REVIEW (customer_id, product_id, rating, review_title, review_text, approved)
            VALUES (%s, %s, %s, %s, %s, TRUE)
        """, (
            data['customer_id'],
            data['product_id'],
            data['rating'],
            data.get('review_title', ''),
            data.get('review_text', '')
        ))
        
        cnx.commit()
        cursor.close()
        cnx.close()
        
        return jsonify({'message': 'Review submitted'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Update order status"""
    try:
        data = request.json
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'Status is required'}), 400
            
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor()
        cursor.execute("UPDATE `ORDER` SET order_status = %s WHERE order_id = %s", (new_status, order_id))
        
        cnx.commit()
        cursor.close()
        cnx.close()
        
        return jsonify({'message': 'Order status updated'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products/<int:product_id>/eligibility/<int:customer_id>', methods=['GET'])
def check_review_eligibility(product_id, customer_id):
    """Check if customer can review product"""
    try:
        cnx = get_db_connection()
        if not cnx:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = cnx.cursor()
        
        # Check if user has a delivered order containing this product
        query = """
            SELECT 1
            FROM `ORDER` o
            JOIN ORDER_DETAIL od ON o.order_id = od.order_id
            WHERE o.customer_id = %s 
              AND od.product_id = %s 
              AND o.order_status = 'delivered'
            LIMIT 1
        """
        cursor.execute(query, (customer_id, product_id))
        can_review = cursor.fetchone() is not None
        
        cursor.close()
        cnx.close()
        
        return jsonify({'can_review': can_review}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)

