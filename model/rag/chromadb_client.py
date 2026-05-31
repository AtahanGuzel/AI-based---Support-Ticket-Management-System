import chromadb
from chromadb.utils import embedding_functions

# Persistent storage — data survives server restarts
client = chromadb.PersistentClient(path="./chroma_store")

embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

# Two separate collections for different purposes
knowledge_base_collection = client.get_or_create_collection(
    name="knowledge_base",
    embedding_function=embedding_function,
    metadata={"hnsw:space": "cosine"}
)

open_tickets_collection = client.get_or_create_collection(
    name="open_tickets",
    embedding_function=embedding_function,
    metadata={"hnsw:space": "cosine"}
)


def get_knowledge_base():
    return knowledge_base_collection


def get_open_tickets():
    return open_tickets_collection
