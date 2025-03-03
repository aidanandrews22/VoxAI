from pinecone import Pinecone

pc = Pinecone(api_key="pcsk_3CBmqn_P1uamkbVmcBoW38RLRwqvT3riPrH5hTZ84FettakCvgXbJDPeND8LfHHV74VrPU")
index = pc.Index("llama-text-embed-v2-index")

search_with_text = index.search_records(
    namespace="", 
    query={
        "inputs": {"text": "Can you see the chess position"}, 
        "top_k": 4
    }
)

print(search_with_text)