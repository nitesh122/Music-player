#!/usr/bin/env python3
"""
Backend API Test Suite for Salil Music Player
Tests all API endpoints for time-based playlist functionality
"""

import requests
import json
import os
from datetime import datetime
import time

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://salil-music.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

class SalilMusicAPITester:
    def __init__(self):
        self.base_url = API_BASE
        self.test_results = []
        self.playlist_ids = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        if response_data:
            result['response_data'] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        print(f"   {message}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        print()

    def test_root_endpoint(self):
        """Test GET /api/ - Root API endpoint"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ['message', 'version', 'endpoints']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Root API Endpoint", False, 
                                f"Missing required fields: {missing_fields}", data)
                    return False
                
                # Check if endpoints list contains expected endpoints
                expected_endpoints = [
                    "GET /api/current-playlist",
                    "GET /api/playlist/:id", 
                    "GET /api/playlists",
                    "GET /api/songs"
                ]
                
                endpoints_match = all(endpoint in data['endpoints'] for endpoint in expected_endpoints)
                
                if endpoints_match:
                    self.log_test("Root API Endpoint", True, 
                                f"API info returned successfully with {len(data['endpoints'])} endpoints", data)
                    return True
                else:
                    self.log_test("Root API Endpoint", False, 
                                f"Expected endpoints not found. Got: {data['endpoints']}", data)
                    return False
            else:
                self.log_test("Root API Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Root API Endpoint", False, f"Request failed: {str(e)}")
            return False

    def test_all_playlists(self):
        """Test GET /api/playlists - Get all playlists"""
        try:
            response = requests.get(f"{self.base_url}/playlists", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test("All Playlists Endpoint", False, 
                                "Response should be a list", data)
                    return False
                
                if len(data) != 6:
                    self.log_test("All Playlists Endpoint", False, 
                                f"Expected 6 playlists, got {len(data)}", data)
                    return False
                
                # Check playlist structure
                required_fields = ['id', 'name', 'time_block', 'start_time', 'end_time']
                for playlist in data:
                    missing_fields = [field for field in required_fields if field not in playlist]
                    if missing_fields:
                        self.log_test("All Playlists Endpoint", False, 
                                    f"Playlist missing fields: {missing_fields}", playlist)
                        return False
                    
                    # Store playlist IDs for later tests
                    if playlist['id'] not in self.playlist_ids:
                        self.playlist_ids.append(playlist['id'])
                
                # Check time blocks
                expected_time_blocks = ['early-morning', 'morning', 'afternoon', 'evening', 'night', 'late-night']
                actual_time_blocks = [p['time_block'] for p in data]
                
                if set(actual_time_blocks) != set(expected_time_blocks):
                    self.log_test("All Playlists Endpoint", False, 
                                f"Expected time blocks {expected_time_blocks}, got {actual_time_blocks}", data)
                    return False
                
                self.log_test("All Playlists Endpoint", True, 
                            f"Successfully retrieved {len(data)} playlists with all 6 time blocks")
                return True
            else:
                self.log_test("All Playlists Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("All Playlists Endpoint", False, f"Request failed: {str(e)}")
            return False

    def test_all_songs(self):
        """Test GET /api/songs - Get all songs"""
        try:
            response = requests.get(f"{self.base_url}/songs", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test("All Songs Endpoint", False, 
                                "Response should be a list", data)
                    return False
                
                if len(data) != 18:  # 6 time blocks * 3 songs each
                    self.log_test("All Songs Endpoint", False, 
                                f"Expected 18 songs (6 time blocks * 3 songs), got {len(data)}", data)
                    return False
                
                # Check song structure
                required_fields = ['id', 'playlist_id', 'title', 'artist', 'time_block']
                for song in data:
                    missing_fields = [field for field in required_fields if field not in song]
                    if missing_fields:
                        self.log_test("All Songs Endpoint", False, 
                                    f"Song missing fields: {missing_fields}", song)
                        return False
                
                # Check time block distribution
                time_block_counts = {}
                for song in data:
                    time_block = song['time_block']
                    time_block_counts[time_block] = time_block_counts.get(time_block, 0) + 1
                
                expected_time_blocks = ['early-morning', 'morning', 'afternoon', 'evening', 'night', 'late-night']
                for time_block in expected_time_blocks:
                    if time_block_counts.get(time_block, 0) != 3:
                        self.log_test("All Songs Endpoint", False, 
                                    f"Expected 3 songs for {time_block}, got {time_block_counts.get(time_block, 0)}")
                        return False
                
                self.log_test("All Songs Endpoint", True, 
                            f"Successfully retrieved {len(data)} songs with proper time block distribution")
                return True
            else:
                self.log_test("All Songs Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("All Songs Endpoint", False, f"Request failed: {str(e)}")
            return False

    def test_current_playlist(self):
        """Test GET /api/current-playlist - Get current time-based playlist"""
        try:
            response = requests.get(f"{self.base_url}/current-playlist", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ['playlist', 'songs', 'current_time_block']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Current Playlist Endpoint", False, 
                                f"Missing required fields: {missing_fields}", data)
                    return False
                
                # Check playlist structure
                playlist = data['playlist']
                playlist_fields = ['id', 'name', 'time_block', 'start_time', 'end_time']
                missing_playlist_fields = [field for field in playlist_fields if field not in playlist]
                
                if missing_playlist_fields:
                    self.log_test("Current Playlist Endpoint", False, 
                                f"Playlist missing fields: {missing_playlist_fields}", playlist)
                    return False
                
                # Check songs structure
                songs = data['songs']
                if not isinstance(songs, list) or len(songs) != 3:
                    self.log_test("Current Playlist Endpoint", False, 
                                f"Expected 3 songs, got {len(songs) if isinstance(songs, list) else 'non-list'}", data)
                    return False
                
                # Verify current time block logic
                current_hour = datetime.now().hour
                current_time_block = data['current_time_block']
                
                # Time block mapping
                time_block_hours = {
                    'early-morning': (4, 8),
                    'morning': (8, 12),
                    'afternoon': (12, 16),
                    'evening': (16, 20),
                    'night': (20, 24),
                    'late-night': (0, 4)
                }
                
                expected_block = None
                for block, (start, end) in time_block_hours.items():
                    if start <= end:  # Normal range
                        if start <= current_hour < end:
                            expected_block = block
                            break
                    else:  # Overnight range (late-night)
                        if current_hour >= start or current_hour < end:
                            expected_block = block
                            break
                
                if expected_block != current_time_block:
                    self.log_test("Current Playlist Endpoint", False, 
                                f"Time block detection incorrect. Current hour: {current_hour}, Expected: {expected_block}, Got: {current_time_block}")
                    return False
                
                self.log_test("Current Playlist Endpoint", True, 
                            f"Successfully retrieved current playlist for {current_time_block} time block with {len(songs)} songs")
                return True
            else:
                self.log_test("Current Playlist Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Current Playlist Endpoint", False, f"Request failed: {str(e)}")
            return False

    def test_specific_playlist(self):
        """Test GET /api/playlist/{id} - Get specific playlist by ID"""
        if not self.playlist_ids:
            self.log_test("Specific Playlist Endpoint", False, 
                        "No playlist IDs available from previous tests")
            return False
        
        try:
            # Test with first playlist ID
            playlist_id = self.playlist_ids[0]
            response = requests.get(f"{self.base_url}/playlist/{playlist_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ['playlist', 'songs']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Specific Playlist Endpoint", False, 
                                f"Missing required fields: {missing_fields}", data)
                    return False
                
                # Check playlist structure
                playlist = data['playlist']
                if playlist['id'] != playlist_id:
                    self.log_test("Specific Playlist Endpoint", False, 
                                f"Requested playlist ID {playlist_id}, got {playlist['id']}")
                    return False
                
                # Check songs
                songs = data['songs']
                if not isinstance(songs, list) or len(songs) != 3:
                    self.log_test("Specific Playlist Endpoint", False, 
                                f"Expected 3 songs, got {len(songs) if isinstance(songs, list) else 'non-list'}")
                    return False
                
                self.log_test("Specific Playlist Endpoint", True, 
                            f"Successfully retrieved playlist '{playlist['name']}' with {len(songs)} songs")
                return True
            else:
                self.log_test("Specific Playlist Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Specific Playlist Endpoint", False, f"Request failed: {str(e)}")
            return False

    def test_playlist_songs(self):
        """Test GET /api/playlist/{id}/songs - Get songs for specific playlist"""
        if not self.playlist_ids:
            self.log_test("Playlist Songs Endpoint", False, 
                        "No playlist IDs available from previous tests")
            return False
        
        try:
            # Test with first playlist ID
            playlist_id = self.playlist_ids[0]
            response = requests.get(f"{self.base_url}/playlist/{playlist_id}/songs", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test("Playlist Songs Endpoint", False, 
                                "Response should be a list", data)
                    return False
                
                if len(data) != 3:
                    self.log_test("Playlist Songs Endpoint", False, 
                                f"Expected 3 songs, got {len(data)}")
                    return False
                
                # Check song structure
                required_fields = ['id', 'playlist_id', 'title', 'artist', 'time_block']
                for song in data:
                    missing_fields = [field for field in required_fields if field not in song]
                    if missing_fields:
                        self.log_test("Playlist Songs Endpoint", False, 
                                    f"Song missing fields: {missing_fields}", song)
                        return False
                    
                    # Verify playlist_id matches
                    if song['playlist_id'] != playlist_id:
                        self.log_test("Playlist Songs Endpoint", False, 
                                    f"Song playlist_id {song['playlist_id']} doesn't match requested {playlist_id}")
                        return False
                
                self.log_test("Playlist Songs Endpoint", True, 
                            f"Successfully retrieved {len(data)} songs for playlist {playlist_id}")
                return True
            else:
                self.log_test("Playlist Songs Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Playlist Songs Endpoint", False, f"Request failed: {str(e)}")
            return False

    def test_invalid_playlist_id(self):
        """Test error handling for invalid playlist ID"""
        try:
            invalid_id = "invalid-playlist-id-12345"
            response = requests.get(f"{self.base_url}/playlist/{invalid_id}", timeout=10)
            
            if response.status_code == 404:
                data = response.json()
                if 'error' in data:
                    self.log_test("Invalid Playlist ID Handling", True, 
                                f"Correctly returned 404 for invalid playlist ID")
                    return True
                else:
                    self.log_test("Invalid Playlist ID Handling", False, 
                                "404 response missing error field", data)
                    return False
            else:
                self.log_test("Invalid Playlist ID Handling", False, 
                            f"Expected 404, got HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Invalid Playlist ID Handling", False, f"Request failed: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🎵 Starting Salil Music Player Backend API Tests")
        print(f"🌐 Testing API at: {self.base_url}")
        print("=" * 60)
        
        # Test order matters - some tests depend on data from previous tests
        tests = [
            self.test_root_endpoint,
            self.test_all_playlists,  # This populates playlist_ids
            self.test_all_songs,
            self.test_current_playlist,
            self.test_specific_playlist,  # Depends on playlist_ids
            self.test_playlist_songs,     # Depends on playlist_ids
            self.test_invalid_playlist_id
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            time.sleep(0.5)  # Small delay between tests
        
        print("=" * 60)
        print(f"🏁 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ All backend API tests PASSED!")
            return True
        else:
            print(f"❌ {total - passed} tests FAILED!")
            return False

    def get_test_summary(self):
        """Get summary of test results"""
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        summary = {
            'total_tests': total,
            'passed': passed,
            'failed': total - passed,
            'success_rate': (passed / total * 100) if total > 0 else 0,
            'details': self.test_results
        }
        
        return summary

if __name__ == "__main__":
    tester = SalilMusicAPITester()
    success = tester.run_all_tests()
    
    # Print detailed summary
    summary = tester.get_test_summary()
    print(f"\n📊 Detailed Summary:")
    print(f"   Success Rate: {summary['success_rate']:.1f}%")
    print(f"   Total Tests: {summary['total_tests']}")
    print(f"   Passed: {summary['passed']}")
    print(f"   Failed: {summary['failed']}")
    
    if not success:
        print("\n❌ Critical Issues Found:")
        for result in summary['details']:
            if not result['success']:
                print(f"   - {result['test']}: {result['message']}")
    
    exit(0 if success else 1)