"""
View and manage Supabase auth users
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('/app/backend/.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def list_all_users():
    """List all users"""
    supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    
    print("=" * 70)
    print("SUPABASE USERS LIST")
    print("=" * 70)
    
    try:
        response = supabase.auth.admin.list_users()
        users = response
        
        if hasattr(users, '__iter__'):
            user_list = list(users)
            print(f"\n✅ Total users in database: {len(user_list)}")
            
            for i, user in enumerate(user_list, 1):
                print(f"\n{i}. Email: {user.email}")
                print(f"   ID: {user.id}")
                print(f"   Name: {user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}")
                print(f"   Created: {user.created_at}")
                print(f"   Last Sign In: {user.last_sign_in_at}")
                print(f"   Confirmed: {'Yes' if user.email_confirmed_at else 'No'}")
            
            return user_list
        else:
            print(f"Users: {users}")
            return []
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return []

def delete_user(user_id: str):
    """Delete a specific user"""
    supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    
    try:
        supabase.auth.admin.delete_user(user_id)
        print(f"✅ Deleted user: {user_id}")
        return True
    except Exception as e:
        print(f"❌ Error deleting user: {str(e)}")
        return False

if __name__ == "__main__":
    users = list_all_users()
    
    print("\n" + "=" * 70)
    print("SIGN-UP ISSUE ANALYSIS")
    print("=" * 70)
    print("\n📊 Findings:")
    print(f"   - Database contains {len(users)} existing user(s)")
    print("   - When new users try to sign up with these emails, they get 'User already exists'")
    print("\n💡 Solutions:")
    print("   1. New users should use DIFFERENT email addresses")
    print("   2. OR delete test users if they're not needed (use delete_user function)")
    print("   3. OR inform users that forked environment shares database with original")
    
    if users:
        print("\n⚠️  To allow fresh sign-ups:")
        print("   - Delete test users: delete_user('user_id')")
        print("   - OR users must use emails NOT in the list above")
