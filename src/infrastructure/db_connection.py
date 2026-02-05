import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

class Neo4jConnection:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Neo4jConnection, cls).__new__(cls)
            
            uri = os.getenv("NEO4J_URI")
            user = os.getenv("NEO4J_USER")
            password = os.getenv("NEO4J_PASSWORD")
            
            try:
                cls._instance.driver = GraphDatabase.driver(uri, auth=(user, password))
                print("✅ Connected to Neo4j successfully!")
            except Exception as e:
                print(f"❌ Failed to connect to Neo4j: {e}")
                cls._instance = None
        return cls._instance

    def close(self):
        if self.driver:
            self.driver.close()
            print("🔒 Connection closed.")

    def verify_connectivity(self):
        try:
            self.driver.verify_connectivity()
            return True
        except Exception as e:
            print(f"Connection Error: {e}")
            return False

if __name__ == "__main__":
    db = Neo4jConnection()
    if db.verify_connectivity():
        print("🚀 Ready to build the Graph!")
        db.close()