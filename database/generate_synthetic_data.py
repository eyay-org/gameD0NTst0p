"""
Synthetic Data Generator for Game Store Database
Generates realistic test data for all tables using Faker library.
"""

import mysql.connector
import os
import random
from datetime import datetime, timedelta
from decimal import Decimal
from dotenv import load_dotenv
from faker import Faker
import hashlib

# Load environment variables
load_dotenv()
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")

# Initialize Faker
fake = Faker("tr_TR")  # Turkish locale for Turkish names/addresses
Faker.seed(42)  # For reproducibility

# Configuration
NUM_CUSTOMERS = 200
NUM_SUPPLIERS = 15
NUM_ADDRESSES_PER_CUSTOMER = (1, 3)  # Random between 1-3 addresses per customer
NUM_BRANCHES = 5
NUM_CART_ITEMS = 150
NUM_REVIEWS = 300
NUM_ORDERS = 250
NUM_ORDER_ITEMS_PER_ORDER = (1, 5)  # Random between 1-5 items per order
NUM_PURCHASES = 100
NUM_RETURNS = 30
NUM_SALES = 200
INVENTORY_FOR_ALL_PRODUCTS = True  # Generate inventory for all products


def hash_password(password):
    """Simple password hashing (use bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()


def load_customers(cnx, cursor):
    """Generate CUSTOMER data"""
    print("=" * 60)
    print("1. Generating CUSTOMER data...")
    print("=" * 60)

    # Check existing emails in database
    cursor.execute("SELECT email FROM CUSTOMER")
    existing_emails = {row[0] for row in cursor.fetchall()}

    query = """
        INSERT INTO CUSTOMER 
        (first_name, last_name, email, password_hash, phone, registration_date, active_status, is_admin)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

    customer_ids = []
    emails_used = set(existing_emails)  # Start with existing emails
    max_attempts = 10  # Maximum attempts to generate unique email

    # --- Create Admin User First ---
    admin_email = "admin@gamestore.com"
    if admin_email not in existing_emails:
        try:
            cursor.execute(
                query,
                (
                    "Admin",
                    "User",
                    admin_email,
                    hash_password("admin123"),
                    fake.phone_number()[:20],
                    datetime.now().date(),
                    True,  # active_status
                    True   # is_admin
                ),
            )
            customer_ids.append(cursor.lastrowid)
            emails_used.add(admin_email)
            print("  [OK] Created Admin User: admin@gamestore.com")
        except mysql.connector.Error as e:
            print(f"  [X] Error inserting admin user: {e}")

    # --- Generate Random Customers ---
    for i in range(NUM_CUSTOMERS):
        first_name = fake.first_name()
        last_name = fake.last_name()

        # Ensure unique email - try multiple times
        email = None
        for attempt in range(max_attempts):
            candidate_email = fake.email()
            if candidate_email not in emails_used:
                email = candidate_email
                emails_used.add(email)
                break

        if email is None:
            # Fallback: use timestamp-based email
            email = f"customer_{i}_{fake.random_int(min=1000, max=9999)}@{fake.domain_name()}"
            emails_used.add(email)

        password_hash = hash_password("password123")  # Default password
        phone = fake.phone_number()[:20]  # Limit to 20 chars
        registration_date = fake.date_between(start_date="-2y", end_date="today")
        active_status = random.choice([True, True, True, False])  # 75% active
        is_admin = False

        try:
            cursor.execute(
                query,
                (
                    first_name,
                    last_name,
                    email,
                    password_hash,
                    phone,
                    registration_date,
                    active_status,
                    is_admin
                ),
            )
            customer_ids.append(cursor.lastrowid)
        except mysql.connector.Error as e:
            print(f"  [X] Error inserting customer {i+1}: {e}")
            continue

    cnx.commit()
    print(f"  [OK] Generated {len(customer_ids)} customers")
    return customer_ids


def load_suppliers(cnx, cursor):
    """Generate SUPPLIER data"""
    print("\n" + "=" * 60)
    print("2. Generating SUPPLIER data...")
    print("=" * 60)

    query = """
        INSERT INTO SUPPLIER 
        (supplier_name, payment_terms, active_status, contact_address, contact_phone, contact_email)
        VALUES (%s, %s, %s, %s, %s, %s)
    """

    payment_terms_options = [
        "Net 30",
        "Net 60",
        "Net 90",
        "Cash on Delivery",
        "2/10 Net 30",
        "Due on Receipt",
        "Net 15",
    ]

    supplier_ids = []

    for i in range(NUM_SUPPLIERS):
        supplier_name = fake.company()
        payment_terms = random.choice(payment_terms_options)
        active_status = random.choice([True, True, False])  # Mostly active
        contact_address = fake.address()
        contact_phone = fake.phone_number()[:20]
        contact_email = fake.company_email()

        try:
            cursor.execute(
                query,
                (
                    supplier_name,
                    payment_terms,
                    active_status,
                    contact_address,
                    contact_phone,
                    contact_email,
                ),
            )
            supplier_ids.append(cursor.lastrowid)
        except mysql.connector.Error as e:
            print(f"  [X] Error inserting supplier {i+1}: {e}")
            continue

    cnx.commit()
    print(f"  [OK] Generated {len(supplier_ids)} suppliers")
    return supplier_ids


def load_addresses(cnx, cursor, customer_ids):
    """Generate ADDRESS data"""
    print("\n" + "=" * 60)
    print("3. Generating ADDRESS data...")
    print("=" * 60)

    query = """
        INSERT INTO ADDRESS 
        (customer_id, address_type, city, district, neighborhood, full_address, postal_code, default_address)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

    address_types = ["home", "work", "billing", "shipping"]
    turkish_cities = [
        "Istanbul",
        "Ankara",
        "Izmir",
        "Bursa",
        "Antalya",
        "Adana",
        "Gaziantep",
        "Konya",
        "Kayseri",
        "Mersin",
        "Eskisehir",
        "Diyarbakir",
    ]

    address_ids = []

    if not customer_ids:
        print("  [!] No customers available for addresses")
        return []

    for customer_id in customer_ids:
        num_addresses = random.randint(*NUM_ADDRESSES_PER_CUSTOMER)
        has_default = False

        for i in range(num_addresses):
            address_type = random.choice(address_types)
            city = random.choice(turkish_cities)
            district = fake.city_suffix() + " " + fake.city()
            neighborhood = fake.street_name()
            full_address = fake.street_address() + ", " + neighborhood + ", " + district
            postal_code = fake.postcode()[:10]
            default_address = not has_default  # First address is default
            has_default = True

            try:
                cursor.execute(
                    query,
                    (
                        customer_id,
                        address_type,
                        city,
                        district,
                        neighborhood,
                        full_address,
                        postal_code,
                        default_address,
                    ),
                )
                address_ids.append(cursor.lastrowid)
            except mysql.connector.Error as e:
                print(f"  [X] Error inserting address for customer {customer_id}: {e}")
                continue

    cnx.commit()
    print(f"  [OK] Generated {len(address_ids)} addresses")
    return address_ids


def load_branches(cnx, cursor, address_ids):
    """Generate BRANCH data"""
    print("\n" + "=" * 60)
    print("4. Generating BRANCH data...")
    print("=" * 60)

    query = """
        INSERT INTO BRANCH 
        (address_id, branch_name, phone, email, working_hours, manager_name, opening_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    branch_names = [
        "GameStore Merkez",
        "GameStore AVM",
        "GameStore Outlet",
        "GameStore Plus",
        "GameStore Express",
    ]

    working_hours_options = [
        "09:00-22:00",
        "10:00-22:00",
        "09:00-21:00",
        "10:00-21:00",
        "09:00-23:00",
    ]

    branch_ids = []

    # Use first NUM_BRANCHES addresses for branches
    branch_addresses = (
        address_ids[:NUM_BRANCHES] if len(address_ids) >= NUM_BRANCHES else address_ids
    )

    for i, address_id in enumerate(branch_addresses):
        branch_name = (
            branch_names[i] if i < len(branch_names) else f"GameStore Sube {i+1}"
        )
        phone = fake.phone_number()[:20]
        email = fake.company_email()
        working_hours = random.choice(working_hours_options)
        manager_name = fake.name()
        opening_date = fake.date_between(start_date="-5y", end_date="-1y")

        try:
            cursor.execute(
                query,
                (
                    address_id,
                    branch_name,
                    phone,
                    email,
                    working_hours,
                    manager_name,
                    opening_date,
                ),
            )
            branch_ids.append(cursor.lastrowid)
        except mysql.connector.Error as e:
            print(f"  [X] Error inserting branch {i+1}: {e}")
            continue

    cnx.commit()
    print(f"  [OK] Generated {len(branch_ids)} branches")
    return branch_ids


def load_cart_items(cnx, cursor, customer_ids, product_ids):
    """Generate CART data"""
    print("\n" + "=" * 60)
    print("5. Generating CART data...")
    print("=" * 60)

    query = """
        INSERT INTO CART (customer_id, product_id, quantity, added_date)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
    """

    cart_count = 0

    if not customer_ids or not product_ids:
        print("  [!] No customers or products available for cart")
        return 0

    # Select random customers and products
    selected_customers = random.sample(
        customer_ids, min(NUM_CART_ITEMS, len(customer_ids))
    )

    for customer_id in selected_customers:
        # Each customer can have 1-3 items in cart
        num_items = random.randint(1, 3)
        customer_products = random.sample(product_ids, min(num_items, len(product_ids)))

        for product_id in customer_products:
            quantity = random.randint(1, 3)
            added_date = fake.date_time_between(start_date="-30d", end_date="now")

            try:
                cursor.execute(query, (customer_id, product_id, quantity, added_date))
                cart_count += 1
            except mysql.connector.Error as e:
                print(f"  [X] Error inserting cart item: {e}")
                continue

    cnx.commit()
    print(f"  [OK] Generated {cart_count} cart items")
    return cart_count


def load_reviews(cnx, cursor, customer_ids, product_ids):
    """Generate REVIEW data"""
    print("\n" + "=" * 60)
    print("6. Generating REVIEW data...")
    print("=" * 60)

    query = """
        INSERT INTO REVIEW 
        (customer_id, product_id, rating, review_title, review_text, review_date, helpful_count, approved)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

    review_titles = [
        "Great game!",
        "Amazing experience",
        "Not bad",
        "Could be better",
        "Excellent quality",
        "Worth the price",
        "Disappointing",
        "Highly recommended",
        "Good value",
        "Not what I expected",
        "Perfect for casual gaming",
        "Too expensive",
    ]

    review_texts = [
        "This game exceeded my expectations. The graphics are stunning and gameplay is smooth.",
        "Good game overall, but could use some improvements in the story department.",
        "Worth every penny! I've been playing this for hours and still enjoying it.",
        "Not my cup of tea, but I can see why others might like it.",
        "The best game I've played this year. Highly recommend to everyone!",
        "Decent game, but nothing special. Gets repetitive after a while.",
        "Amazing graphics and sound design. The developers did a great job.",
        "I was disappointed with this purchase. Expected more for the price.",
        "Fun game to play with friends. Multiplayer mode is excellent!",
        "Good game, but has some bugs that need fixing.",
    ]

    review_count = 0
    reviewed_combinations = set()  # Track (customer_id, product_id) to avoid duplicates

    if not customer_ids or not product_ids:
        print("  [!] No customers or products available for reviews")
        return 0

    for _ in range(NUM_REVIEWS):
        customer_id = random.choice(customer_ids)
        product_id = random.choice(product_ids)

        # Avoid duplicate reviews
        if (customer_id, product_id) in reviewed_combinations:
            continue
        reviewed_combinations.add((customer_id, product_id))

        rating = random.randint(1, 5)
        review_title = random.choice(review_titles)
        review_text = random.choice(review_texts)
        review_date = fake.date_time_between(start_date="-1y", end_date="now")
        helpful_count = random.randint(0, 50)
        approved = random.choice([True, True, True, False])  # 75% approved

        try:
            cursor.execute(
                query,
                (
                    customer_id,
                    product_id,
                    rating,
                    review_title,
                    review_text,
                    review_date,
                    helpful_count,
                    approved,
                ),
            )
            review_count += 1
        except mysql.connector.Error as e:
            print(f"  [X] Error inserting review: {e}")
            continue

    cnx.commit()
    print(f"  [OK] Generated {review_count} reviews")
    return review_count


def load_orders(cnx, cursor, customer_ids, address_ids):
    """Generate ORDER and ORDER_DETAIL data"""
    print("\n" + "=" * 60)
    print("7. Generating ORDER and ORDER_DETAIL data...")
    print("=" * 60)

    order_query = """
        INSERT INTO `ORDER` 
        (customer_id, order_date, order_status, total_amount, shipping_fee, 
         payment_method, payment_status, tracking_number, estimated_delivery_date, 
         actual_delivery_date, delivery_full_address, delivery_city, 
         billing_full_address, billing_city)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    detail_query = """
        INSERT INTO ORDER_DETAIL (order_id, line_no, product_id, quantity, unit_price)
        VALUES (%s, %s, %s, %s, %s)
    """

    order_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    payment_methods = [
        "credit_card",
        "debit_card",
        "paypal",
        "bank_transfer",
        "cash_on_delivery",
    ]
    payment_statuses = ["pending", "paid", "failed", "refunded"]

    order_ids = []
    order_count = 0

    if not customer_ids:
        print("  [!] No customers available for orders")
        return []

    # Get product prices for order details
    cursor.execute("SELECT product_id, price FROM PRODUCT")
    product_prices = {row[0]: float(row[1]) for row in cursor.fetchall()}
    product_ids = list(product_prices.keys())

    if not product_ids:
        print("  [!] No products available for orders")
        return []

    for i in range(NUM_ORDERS):
        customer_id = random.choice(customer_ids)
        order_date = fake.date_time_between(start_date="-1y", end_date="now")
        order_status = random.choice(order_statuses)
        payment_method = random.choice(payment_methods)
        payment_status = random.choice(payment_statuses)

        # Shipping fee
        shipping_fee = Decimal(str(random.uniform(5.00, 25.00))).quantize(
            Decimal("0.01")
        )

        # Tracking number
        tracking_number = fake.bothify(
            text="TR#########", letters="ABCDEFGHJKLMNPQRSTUVWXYZ"
        )

        # Delivery dates
        estimated_delivery_date = order_date + timedelta(days=random.randint(2, 7))
        actual_delivery_date = None
        if order_status == "delivered":
            actual_delivery_date = estimated_delivery_date + timedelta(
                days=random.randint(0, 2)
            )

        # Addresses
        delivery_address = fake.address()
        delivery_city = fake.city()
        billing_address = fake.address()
        billing_city = fake.city()

        # Calculate total from order details (will be updated after details are added)
        total_amount = Decimal("0.00")

        try:
            cursor.execute(
                order_query,
                (
                    customer_id,
                    order_date,
                    order_status,
                    total_amount,
                    shipping_fee,
                    payment_method,
                    payment_status,
                    tracking_number,
                    estimated_delivery_date.date() if estimated_delivery_date else None,
                    actual_delivery_date.date() if actual_delivery_date else None,
                    delivery_address,
                    delivery_city,
                    billing_address,
                    billing_city,
                ),
            )
            order_id = cursor.lastrowid
            order_ids.append(order_id)

            # Add order details
            num_items = random.randint(*NUM_ORDER_ITEMS_PER_ORDER)
            selected_products = random.sample(
                product_ids, min(num_items, len(product_ids))
            )

            line_no = 1
            for product_id in selected_products:
                quantity = random.randint(1, 3)
                unit_price = Decimal(str(product_prices[product_id])).quantize(
                    Decimal("0.01")
                )
                total_amount += unit_price * quantity

                cursor.execute(
                    detail_query, (order_id, line_no, product_id, quantity, unit_price)
                )
                line_no += 1

            # Update total amount
            total_amount += shipping_fee
            cursor.execute(
                "UPDATE `ORDER` SET total_amount = %s WHERE order_id = %s",
                (total_amount, order_id),
            )

            order_count += 1
        except mysql.connector.Error as e:
            print(f"  [X] Error inserting order {i+1}: {e}")
            cnx.rollback()
            continue

    cnx.commit()
    print(f"  [OK] Generated {order_count} orders with details")
    return order_ids


def load_purchases(cnx, cursor, supplier_ids, product_ids):
    """Generate PURCHASE data"""
    print("\n" + "=" * 60)
    print("8. Generating PURCHASE data...")
    print("=" * 60)

    query = """
        INSERT INTO PURCHASE 
        (supplier_id, product_id, transaction_date, quantity, unit_cost, 
         total_cost, payment_status, payment_date, invoice_no)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    payment_statuses = ["pending", "paid", "partial"]

    # Get product prices to calculate unit_cost (typically 60-80% of sale price)
    cursor.execute("SELECT product_id, price FROM PRODUCT")
    product_prices = {row[0]: float(row[1]) for row in cursor.fetchall()}

    purchase_count = 0

    if not supplier_ids or not product_ids:
        print("  [!] No suppliers or products available for purchases")
        return 0

    for i in range(NUM_PURCHASES):
        supplier_id = random.choice(supplier_ids)
        product_id = random.choice(product_ids)
        transaction_date = fake.date_time_between(start_date="-1y", end_date="now")
        quantity = random.randint(10, 100)

        # Unit cost is 60-80% of sale price
        sale_price = product_prices[product_id]
        unit_cost = Decimal(str(sale_price * random.uniform(0.60, 0.80))).quantize(
            Decimal("0.01")
        )
        total_cost = unit_cost * quantity

        payment_status = random.choice(payment_statuses)
        payment_date = None
        if payment_status == "paid":
            payment_date = transaction_date + timedelta(days=random.randint(1, 30))

        invoice_no = fake.bothify(
            text="INV-####-####", letters="ABCDEFGHJKLMNPQRSTUVWXYZ"
        )

        try:
            cursor.execute(
                query,
                (
                    supplier_id,
                    product_id,
                    transaction_date,
                    quantity,
                    unit_cost,
                    total_cost,
                    payment_status,
                    payment_date.date() if payment_date else None,
                    invoice_no,
                ),
            )
            purchase_count += 1
        except mysql.connector.Error as e:
            print(f"  [X] Error inserting purchase {i+1}: {e}")
            continue

    cnx.commit()
    print(f"  [OK] Generated {purchase_count} purchases")
    return purchase_count


def load_returns(cnx, cursor, customer_ids, order_ids, product_ids):
    """Generate RETURN data"""
    print("\n" + "=" * 60)
    print("9. Generating RETURN data...")
    print("=" * 60)

    query = """
        INSERT INTO `RETURN` 
        (customer_id, order_id, product_id, transaction_date, quantity, 
         refund_amount, return_reason, return_status, refund_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    return_reasons = [
        "Defective product",
        "Wrong item received",
        "Not as described",
        "Changed mind",
        "Damaged during shipping",
        "Quality issues",
        "Size/version mismatch",
        "Duplicate order",
    ]

    return_statuses = ["pending", "approved", "rejected", "completed"]

    # Get order details to find valid product-order combinations
    cursor.execute(
        """
        SELECT od.order_id, od.product_id, od.unit_price, o.customer_id
        FROM ORDER_DETAIL od
        JOIN `ORDER` o ON od.order_id = o.order_id
        WHERE o.order_status = 'delivered'
        LIMIT 1000
    """
    )
    order_details = cursor.fetchall()

    if not order_details:
        print("  [!] No delivered orders found for returns")
        return 0

    return_count = 0

    for i in range(min(NUM_RETURNS, len(order_details))):
        order_id, product_id, unit_price, customer_id = random.choice(order_details)
        transaction_date = fake.date_time_between(start_date="-6m", end_date="now")
        quantity = random.randint(1, 2)  # Usually return 1-2 items
        refund_amount = Decimal(str(float(unit_price) * quantity)).quantize(
            Decimal("0.01")
        )
        return_reason = random.choice(return_reasons)
        return_status = random.choice(return_statuses)
        refund_date = None

        if return_status == "completed":
            refund_date = transaction_date + timedelta(days=random.randint(3, 14))

        try:
            cursor.execute(
                query,
                (
                    customer_id,
                    order_id,
                    product_id,
                    transaction_date,
                    quantity,
                    refund_amount,
                    return_reason,
                    return_status,
                    refund_date.date() if refund_date else None,
                ),
            )
            return_count += 1
        except mysql.connector.Error as e:
            print(f"  [X] Error inserting return {i+1}: {e}")
            continue

    cnx.commit()
    print(f"  [OK] Generated {return_count} returns")
    return return_count


def load_sales(cnx, cursor, customer_ids, order_ids, branch_ids):
    """Generate SALE data"""
    print("\n" + "=" * 60)
    print("10. Generating SALE data...")
    print("=" * 60)

    query = """
        INSERT INTO SALE 
        (customer_id, order_id, branch_id, transaction_date, transaction_amount, 
         cost, profit, sale_type)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

    sale_types = ["online", "in-store"]

    # Get order data
    cursor.execute(
        """
        SELECT order_id, customer_id, total_amount, order_date
        FROM `ORDER`
        WHERE order_status IN ('delivered', 'shipped')
        LIMIT 1000
    """
    )
    orders = cursor.fetchall()

    if not orders:
        print("  [!] No completed orders found for sales")
        return 0

    sale_count = 0

    for i in range(min(NUM_SALES, len(orders))):
        order_id, customer_id, total_amount, order_date = random.choice(orders)

        # Branch (can be NULL for online orders)
        branch_id = None
        sale_type = random.choice(sale_types)
        if sale_type == "in-store" and branch_ids:
            branch_id = random.choice(branch_ids)

        transaction_date = order_date
        transaction_amount = Decimal(str(total_amount)).quantize(Decimal("0.01"))

        # Cost is 60-70% of transaction amount, profit is the difference
        cost = transaction_amount * Decimal("0.65")
        profit = transaction_amount - cost

        try:
            cursor.execute(
                query,
                (
                    customer_id,
                    order_id,
                    branch_id,
                    transaction_date,
                    transaction_amount,
                    cost,
                    profit,
                    sale_type,
                ),
            )
            sale_count += 1
        except mysql.connector.Error as e:
            print(f"  [X] Error inserting sale {i+1}: {e}")
            continue

    cnx.commit()
    print(f"  [OK] Generated {sale_count} sales")
    return sale_count


def load_inventory(cnx, cursor, product_ids, branch_ids):
    """Generate INVENTORY data"""
    print("\n" + "=" * 60)
    print("11. Generating INVENTORY data...")
    print("=" * 60)

    query = """
        INSERT INTO INVENTORY 
        (product_id, branch_id, quantity, minimum_stock, maximum_stock, shelf_location)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
    """

    shelf_locations = [
        "A-1-01",
        "A-1-02",
        "A-2-01",
        "A-2-02",
        "B-1-01",
        "B-1-02",
        "B-2-01",
        "B-2-02",
        "C-1-01",
        "C-1-02",
        "C-2-01",
        "C-2-02",
    ]

    inventory_count = 0

    if not product_ids or not branch_ids:
        print("  [!] No products or branches available for inventory")
        return 0

    if INVENTORY_FOR_ALL_PRODUCTS:
        # Generate inventory for all products in all branches
        for product_id in product_ids:
            for branch_id in branch_ids:
                quantity = random.randint(0, 150)
                minimum_stock = random.randint(5, 15)
                maximum_stock = random.randint(80, 150)
                shelf_location = random.choice(shelf_locations)

                try:
                    cursor.execute(
                        query,
                        (
                            product_id,
                            branch_id,
                            quantity,
                            minimum_stock,
                            maximum_stock,
                            shelf_location,
                        ),
                    )
                    inventory_count += 1
                except mysql.connector.Error as e:
                    print(f"  [X] Error inserting inventory: {e}")
                    continue
    else:
        # Generate inventory for random products
        selected_products = random.sample(product_ids, min(100, len(product_ids)))
        for product_id in selected_products:
            branch_id = random.choice(branch_ids)
            quantity = random.randint(0, 150)
            minimum_stock = random.randint(5, 15)
            maximum_stock = random.randint(80, 150)
            shelf_location = random.choice(shelf_locations)

            try:
                cursor.execute(
                    query,
                    (
                        product_id,
                        branch_id,
                        quantity,
                        minimum_stock,
                        maximum_stock,
                        shelf_location,
                    ),
                )
                inventory_count += 1
            except mysql.connector.Error as e:
                print(f"  [X] Error inserting inventory: {e}")
                continue

    cnx.commit()
    print(f"  [OK] Generated {inventory_count} inventory records")
    return inventory_count


def main():
    """Main function to generate all synthetic data"""
    print("\n" + "=" * 60)
    print("SYNTHETIC DATA GENERATOR")
    print("=" * 60)
    print("\nGenerating realistic test data for all tables...\n")

    cnx = None
    cursor = None

    try:
        # Connect to database
        cnx = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            port=int(DB_PORT),
            database=DB_NAME,
        )
        cursor = cnx.cursor()

        # Get existing product IDs
        cursor.execute("SELECT product_id FROM PRODUCT")
        product_ids = [row[0] for row in cursor.fetchall()]

        if not product_ids:
            print(
                "[X] ERROR: No products found in database. Please run dataload.py first!"
            )
            return

        print(f"[INFO] Found {len(product_ids)} products in database\n")

        # Generate data in dependency order
        customer_ids = load_customers(cnx, cursor)
        supplier_ids = load_suppliers(cnx, cursor)
        address_ids = load_addresses(cnx, cursor, customer_ids)
        branch_ids = load_branches(cnx, cursor, address_ids)
        load_cart_items(cnx, cursor, customer_ids, product_ids)
        load_reviews(cnx, cursor, customer_ids, product_ids)
        order_ids = load_orders(cnx, cursor, customer_ids, address_ids)
        load_purchases(cnx, cursor, supplier_ids, product_ids)
        load_returns(cnx, cursor, customer_ids, order_ids, product_ids)
        load_sales(cnx, cursor, customer_ids, order_ids, branch_ids)
        load_inventory(cnx, cursor, product_ids, branch_ids)

        print("\n" + "=" * 60)
        print("[SUCCESS] All synthetic data generated successfully!")
        print("=" * 60)

    except mysql.connector.Error as err:
        print(f"[X] Database error: {err}")
        if cnx:
            cnx.rollback()
    except Exception as e:
        print(f"[X] Unexpected error: {e}")
        import traceback

        traceback.print_exc()
        if cnx:
            cnx.rollback()
    finally:
        if cursor:
            cursor.close()
        if cnx:
            cnx.close()


if __name__ == "__main__":
    main()
