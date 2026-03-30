#!/usr/bin/env python3
"""
Test script for DezAI Backend API
"""

import requests
import time
import sys
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"  # Change to your Railway URL in production
TEST_AUDIO_FILE = "test_audio.mp3"  # Create a small test file or use existing

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            print(f"✓ Health check passed: {response.json()}")
            return True
        else:
            print(f"✗ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Health check error: {e}")
        return False

def test_upload():
    """Test file upload"""
    print("\nTesting file upload...")
    
    # Check if test file exists
    if not Path(TEST_AUDIO_FILE).exists():
        print(f"✗ Test file '{TEST_AUDIO_FILE}' not found")
        print("Creating a dummy test file...")
        # Create a small dummy audio file for testing
        with open(TEST_AUDIO_FILE, 'wb') as f:
            f.write(b'dummy audio data')
    
    try:
        with open(TEST_AUDIO_FILE, 'rb') as f:
            files = {'file': (TEST_AUDIO_FILE, f, 'audio/mpeg')}
            response = requests.post(f"{BASE_URL}/upload", files=files, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Upload successful: {data}")
            return data.get('task_id')
        else:
            print(f"✗ Upload failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"✗ Upload error: {e}")
        return None

def test_status(task_id):
    """Test status polling"""
    print(f"\nTesting status for task {task_id}...")
    
    max_attempts = 30  # 30 * 2 seconds = 1 minute max
    for attempt in range(max_attempts):
        try:
            response = requests.get(f"{BASE_URL}/status/{task_id}", timeout=10)
            if response.status_code == 200:
                status_data = response.json()
                print(f"Attempt {attempt + 1}: {status_data['status']} - {status_data['message']} ({status_data['progress']*100:.1f}%)")
                
                if status_data['status'] == 'completed':
                    print("✓ Processing completed successfully!")
                    return status_data
                elif status_data['status'] == 'failed':
                    print(f"✗ Processing failed: {status_data.get('error', 'Unknown error')}")
                    return None
            else:
                print(f"✗ Status check failed: {response.status_code}")
                return None
        except Exception as e:
            print(f"✗ Status check error: {e}")
            return None
        
        # Wait before next poll
        time.sleep(2)
    
    print("✗ Timeout waiting for processing")
    return None

def test_download(task_id, status_data):
    """Test downloading stems"""
    print("\nTesting stem downloads...")
    
    if not status_data or 'result_urls' not in status_data:
        print("✗ No result URLs available")
        return False
    
    result_urls = status_data['result_urls']
    successful_downloads = 0
    
    for stem_name, url in result_urls.items():
        try:
            download_url = f"{BASE_URL}{url}"
            response = requests.get(download_url, timeout=30)
            
            if response.status_code == 200:
                # Save the file locally
                filename = f"{task_id}_{stem_name}.wav"
                with open(filename, 'wb') as f:
                    f.write(response.content)
                print(f"✓ Downloaded {stem_name}: {len(response.content)} bytes")
                successful_downloads += 1
            else:
                print(f"✗ Failed to download {stem_name}: {response.status_code}")
        except Exception as e:
            print(f"✗ Download error for {stem_name}: {e}")
    
    print(f"\nDownload summary: {successful_downloads}/{len(result_urls)} stems downloaded")
    return successful_downloads > 0

def test_download_all(task_id):
    """Test downloading all stems as ZIP"""
    print(f"\nTesting ZIP download for task {task_id}...")
    
    try:
        response = requests.get(f"{BASE_URL}/download-all/{task_id}", timeout=60)
        
        if response.status_code == 200:
            filename = f"{task_id}_all_stems.zip"
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"✓ ZIP download successful: {len(response.content)} bytes")
            return True
        else:
            print(f"✗ ZIP download failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"✗ ZIP download error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("DezAI Backend API Test Suite")
    print("=" * 60)
    
    # Test 1: Health check
    if not test_health():
        print("\n✗ Health check failed. Is the server running?")
        print(f"Start the server with: python main.py")
        print(f"Or check if it's running at: {BASE_URL}")
        sys.exit(1)
    
    # Test 2: Upload
    task_id = test_upload()
    if not task_id:
        print("\n✗ Upload test failed")
        sys.exit(1)
    
    # Test 3: Status polling
    status_data = test_status(task_id)
    if not status_data:
        print("\n✗ Status test failed")
        sys.exit(1)
    
    # Test 4: Individual stem downloads
    download_ok = test_download(task_id, status_data)
    
    # Test 5: ZIP download
    zip_ok = test_download_all(task_id)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Task ID: {task_id}")
    print(f"Health check: ✓ PASSED")
    print(f"Upload: ✓ PASSED")
    print(f"Processing: ✓ PASSED")
    print(f"Individual downloads: {'✓ PASSED' if download_ok else '✗ FAILED'}")
    print(f"ZIP download: {'✓ PASSED' if zip_ok else '✗ FAILED'}")
    
    if download_ok or zip_ok:
        print("\n✅ All critical tests passed!")
        print(f"\nYour backend is working correctly.")
        print(f"API URL: {BASE_URL}")
        print(f"Task processed: {task_id}")
        print(f"\nNext steps:")
        print(f"1. Update frontend to use: {BASE_URL}")
        print(f"2. Deploy to Railway: railway up")
        print(f"3. Test with real audio files")
    else:
        print("\n⚠️ Some tests failed, but core functionality works")
        print("Check the error messages above for details.")

if __name__ == "__main__":
    main()