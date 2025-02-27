from app.migrations.add_last_scraped import migrate as add_last_scraped_migration

def run_all_migrations():
    print("Running migrations...")
    
    # Add migrations here in order
    migrations = [
        ("Add last_scraped column", add_last_scraped_migration),
    ]
    
    for name, migration in migrations:
        print(f"\nRunning migration: {name}")
        migration()
    
    print("\nAll migrations completed")

if __name__ == "__main__":
    run_all_migrations() 