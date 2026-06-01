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
    import zipfile
    from pathlib import Path
    import glob

    try:
        cmd = [
            sys.executable, "-m", "gdown", 
            "--folder", folder_url, 
            "-O", output_dir
        ]
        print(f"Executing: {' '.join(cmd)}")
        subprocess.check_call(cmd)
        
        # Unzip all downloaded files
        print("Extracting downloaded ZIP files...")
        zip_files = glob.glob(os.path.join(output_dir, "*.zip"))
        for zip_path in zip_files:
            print(f"Extracting {zip_path}...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(output_dir)
            os.remove(zip_path) # Clean up zip file
            
        print("\n✅ Download and extraction completed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Failed to download folder. Error: {e}")
        print("Please ensure the Google Drive folder permissions are set to 'Anyone with the link'.")
        sys.exit(1)

if __name__ == "__main__":
    DRIVE_URL = "https://drive.google.com/drive/folders/1Nw6CA2mSX3s6Zp7xE2P4fJUuk4QD6rp1"
    download_gdrive_folder(DRIVE_URL)
