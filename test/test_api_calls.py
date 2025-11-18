"""
Test script to verify all IGDB API calls in dataload.py
This script tests each API endpoint without requiring database connection.
"""

import json
from igdb_service import wrapper


def test_genres_api():
    """Test the genres API call"""
    print("=" * 60)
    print("TEST 1: Genres API Call")
    print("=" * 60)
    try:
        api_query = "fields name, slug, url; limit 10;"
        print(f"API Query: {api_query}")
        print("\nMaking API request...")

        byte_array = wrapper.api_request("genres", api_query)
        genres_list = json.loads(byte_array)

        print(f"[OK] SUCCESS: Retrieved {len(genres_list)} genres")
        print("\nSample genres:")
        for i, genre in enumerate(genres_list[:5], 1):
            print(
                f"  {i}. ID: {genre.get('id')}, Name: {genre.get('name')}, Slug: {genre.get('slug')}"
            )

        if len(genres_list) > 0:
            print(f"\nFull structure of first genre:")
            print(json.dumps(genres_list[0], indent=2))

        return True, genres_list
    except Exception as e:
        print(f"[X] FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False, None


def test_games_api():
    """Test the games API call"""
    print("\n" + "=" * 60)
    print("TEST 2: Games API Call")
    print("=" * 60)
    try:
        api_query = (
            "fields name, summary, storyline, first_release_date, "
            "platforms.name, platforms.id, "
            "genres, "
            "involved_companies.company.name, involved_companies.developer, involved_companies.publisher, "
            "age_ratings.rating, age_ratings.category, "
            "game_modes.name, "
            "language_supports.language.name, language_supports.language_support_type, "
            "cover.url, cover.image_id, "
            "screenshots.url, screenshots.image_id, "
            "videos.video_id, videos.name, "
            "aggregated_rating, total_rating, rating_count, "
            "websites.url, websites.category; "
            "where platforms = (48, 49, 130, 6) & first_release_date != null & summary != null; "
            "limit 3; offset 0;"
        )
        print(f"API Query: {api_query[:100]}...")
        print("\nMaking API request...")

        byte_array = wrapper.api_request("games", api_query)
        games_list = json.loads(byte_array)

        print(f"[OK] SUCCESS: Retrieved {len(games_list)} games")

        if len(games_list) > 0:
            print("\nSample game data:")
            game = games_list[0]
            print(f"  Name: {game.get('name')}")
            print(f"  Summary: {game.get('summary', 'N/A')[:100]}...")
            print(f"  Release Date: {game.get('first_release_date')}")
            print(f"  Platforms: {[p.get('name') for p in game.get('platforms', [])]}")
            print(f"  Genres: {game.get('genres', [])}")
            print(f"  Has Cover: {bool(game.get('cover'))}")
            print(f"  Screenshots Count: {len(game.get('screenshots', []))}")
            print(f"  Videos Count: {len(game.get('videos', []))}")
            print(f"  Rating: {game.get('total_rating')}")

            print(f"\nFull structure of first game (first 2000 chars):")
            game_json = json.dumps(game, indent=2)
            print(game_json[:2000])
            if len(game_json) > 2000:
                print(f"... (truncated, total length: {len(game_json)} chars)")

        return True, games_list
    except Exception as e:
        print(f"[X] FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False, None


def test_platforms_api():
    """Test the platforms/consoles API call"""
    print("\n" + "=" * 60)
    print("TEST 3: Platforms/Consoles API Call")
    print("=" * 60)
    try:
        console_ids = "(48, 49, 130, 167, 169)"
        api_query = (
            "fields name, summary, platform_logo.url, platform_logo.image_id, "
            "platform_family.name, category, generation, "
            "versions.name, versions.summary, "
            "websites.url, websites.category; "
            f"where id = {console_ids};"
            "limit 10;"
        )
        print(f"API Query: {api_query}")
        print("\nMaking API request...")

        byte_array = wrapper.api_request("platforms", api_query)
        console_list = json.loads(byte_array)

        print(f"[OK] SUCCESS: Retrieved {len(console_list)} platforms")

        if len(console_list) > 0:
            print("\nSample platform data:")
            for i, console in enumerate(console_list[:3], 1):
                print(f"\n  Platform {i}:")
                print(f"    Name: {console.get('name')}")
                print(
                    f"    Family: {console.get('platform_family', {}).get('name', 'N/A')}"
                )
                print(f"    Generation: {console.get('generation', 'N/A')}")
                print(f"    Has Logo: {bool(console.get('platform_logo'))}")
                print(f"    Summary: {console.get('summary', 'N/A')[:80]}...")

            print(f"\nFull structure of first platform:")
            print(json.dumps(console_list[0], indent=2))

        return True, console_list
    except Exception as e:
        print(f"[X] FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False, None


def test_cover_image_url():
    """Test cover image URL construction"""
    print("\n" + "=" * 60)
    print("TEST 4: Cover Image URL Construction")
    print("=" * 60)
    try:
        # Get a game with cover
        api_query = (
            "fields name, cover.url, cover.image_id; where cover != null; limit 1;"
        )
        byte_array = wrapper.api_request("games", api_query)
        games_list = json.loads(byte_array)

        if len(games_list) > 0:
            game = games_list[0]
            cover = game.get("cover")
            if cover:
                print(f"Game: {game.get('name')}")
                print(f"Cover URL: {cover.get('url')}")
                print(f"Cover Image ID: {cover.get('image_id')}")

                # Test URL construction
                cover_url = cover.get("url", "")
                if cover_url.startswith("//"):
                    cover_url = "https:" + cover_url
                elif not cover_url.startswith("http"):
                    image_id = cover.get("image_id", "")
                    if image_id:
                        cover_url = f"https://images.igdb.com/igdb/image/upload/t_cover_big/{image_id}.jpg"

                print(f"Constructed URL: {cover_url}")
                print("[OK] SUCCESS: URL construction works")
                return True
            else:
                print("[!] WARNING: No cover found in test game")
                return False
        else:
            print("[!] WARNING: No games found with covers")
            return False
    except Exception as e:
        print(f"[X] FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_screenshot_url():
    """Test screenshot URL construction"""
    print("\n" + "=" * 60)
    print("TEST 5: Screenshot URL Construction")
    print("=" * 60)
    try:
        # Get a game with screenshots
        api_query = "fields name, screenshots.url, screenshots.image_id; where screenshots != null; limit 1;"
        byte_array = wrapper.api_request("games", api_query)
        games_list = json.loads(byte_array)

        if len(games_list) > 0:
            game = games_list[0]
            screenshots = game.get("screenshots", [])
            if screenshots:
                print(f"Game: {game.get('name')}")
                print(f"Screenshots found: {len(screenshots)}")

                screenshot = screenshots[0]
                print(f"Screenshot URL: {screenshot.get('url')}")
                print(f"Screenshot Image ID: {screenshot.get('image_id')}")

                # Test URL construction
                screenshot_url = screenshot.get("url", "")
                if screenshot_url.startswith("//"):
                    screenshot_url = "https:" + screenshot_url
                elif not screenshot_url.startswith("http"):
                    image_id = screenshot.get("image_id", "")
                    if image_id:
                        screenshot_url = f"https://images.igdb.com/igdb/image/upload/t_screenshot_big/{image_id}.jpg"

                print(f"Constructed URL: {screenshot_url}")
                print("[OK] SUCCESS: URL construction works")
                return True
            else:
                print("[!] WARNING: No screenshots found in test game")
                return False
        else:
            print("[!] WARNING: No games found with screenshots")
            return False
    except Exception as e:
        print(f"[X] FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_video_url():
    """Test video URL construction"""
    print("\n" + "=" * 60)
    print("TEST 6: Video URL Construction")
    print("=" * 60)
    try:
        # Get a game with videos
        api_query = (
            "fields name, videos.video_id, videos.name; where videos != null; limit 1;"
        )
        byte_array = wrapper.api_request("games", api_query)
        games_list = json.loads(byte_array)

        if len(games_list) > 0:
            game = games_list[0]
            videos = game.get("videos", [])
            if videos:
                print(f"Game: {game.get('name')}")
                print(f"Videos found: {len(videos)}")

                video = videos[0]
                print(f"Video ID: {video.get('video_id')}")
                print(f"Video Name: {video.get('name')}")

                # Test URL construction
                video_id = video.get("video_id", "")
                if video_id:
                    video_url = f"https://www.youtube.com/watch?v={video_id}"
                    print(f"Constructed URL: {video_url}")
                    print("[OK] SUCCESS: URL construction works")
                    return True
                else:
                    print("[!] WARNING: No video_id found")
                    return False
            else:
                print("[!] WARNING: No videos found in test game")
                return False
        else:
            print("[!] WARNING: No games found with videos")
            return False
    except Exception as e:
        print(f"[X] FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False


def main():
    """Run all API tests"""
    print("\n" + "=" * 60)
    print("IGDB API CALLS TEST SUITE")
    print("=" * 60)
    print("\nTesting all API endpoints used in dataload.py...\n")

    results = {}

    # Test 1: Genres
    success, data = test_genres_api()
    results["Genres"] = success

    # Test 2: Games
    success, data = test_games_api()
    results["Games"] = success

    # Test 3: Platforms
    success, data = test_platforms_api()
    results["Platforms"] = success

    # Test 4: Cover Image URLs
    results["Cover URLs"] = test_cover_image_url()

    # Test 5: Screenshot URLs
    results["Screenshot URLs"] = test_screenshot_url()

    # Test 6: Video URLs
    results["Video URLs"] = test_video_url()

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    for test_name, success in results.items():
        status = "[OK] PASSED" if success else "[X] FAILED"
        print(f"{test_name:20s}: {status}")

    total = len(results)
    passed = sum(1 for v in results.values() if v)
    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n[SUCCESS] All API calls are working correctly!")
    else:
        print(
            f"\n[WARNING] {total - passed} test(s) failed. Please check the errors above."
        )


if __name__ == "__main__":
    main()
