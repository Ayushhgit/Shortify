import firebase_admin
from firebase_admin import credentials, auth

# Initialize only once
cred = credentials.Certificate(r"C:\Hari om\Shortify\backend\shortify-696e1-firebase-adminsdk-fbsvc-d55865f793.json")
firebase_admin.initialize_app(cred)

# List users
def list_all_users():
    page = auth.list_users()
    while page:
        for user in page.users:
            print(f"UID: {user.uid}, Email: {user.email}")
        page = page.get_next_page()

if __name__ == "__main__":
    list_all_users()
