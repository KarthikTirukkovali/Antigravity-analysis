import os
import sys
import subprocess

def download_gdrive_folder(folder_url, output_dir="Downloaded_Data"):
    """
    Downloads a public Google Drive folder using gdown.
    """
    print(f"Downloading data from Google Drive to {output_dir}...")
    
    # Ensure gdown is installed
    try:
        import gdown
    except ImportError:
        print("Installing gdown...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "gdown"])
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Run gdown command
    try:
        # We use subprocess because gdown's python API for folders can be finicky
        cmd = [
            sys.executable, "-m", "gdown", 
            "--folder", folder_url, 
            "-O", output_dir
        ]
        print(f"Executing: {' '.join(cmd)}")
        subprocess.check_call(cmd)
        print("\n✅ Download completed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Failed to download folder. Error: {e}")
        print("Please ensure the Google Drive folder permissions are set to 'Anyone with the link'.")
        sys.exit(1)

if __name__ == "__main__":
    DRIVE_URL = "https://drive.google.com/drive/folders/1Nw6CA2mSX3s6Zp7xE2P4fJUuk4QD6rp1"
    download_gdrive_folder(DRIVE_URL)
