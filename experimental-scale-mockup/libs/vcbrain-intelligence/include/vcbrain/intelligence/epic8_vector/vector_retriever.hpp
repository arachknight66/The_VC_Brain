#ifndef VCBRAIN_INTELLIGENCE_VECTOR_RETRIEVER_HPP
#define VCBRAIN_INTELLIGENCE_VECTOR_RETRIEVER_HPP

#include <string>
#include <vector>

namespace vcbrain::intelligence::vector {

struct VectorPoint {
    std::string point_id;
    std::vector<float> embedding; // 1536-dimensional vector
    std::string payload_json;
};

struct VectorMatch {
    std::string point_id;
    float cosine_similarity;
    std::string payload_json;
};

class QdrantVectorRetriever {
public:
    QdrantVectorRetriever() = default;

    [[nodiscard]] std::vector<float> generate_embedding(const std::string& text) const;
    void upsert_vector(const VectorPoint& point);
    [[nodiscard]] std::vector<VectorMatch> search_nearest_neighbors(const std::vector<float>& query_vector, size_t top_k = 5) const;

private:
    std::vector<VectorPoint> points_;
};

} // namespace vcbrain::intelligence::vector

#endif // VCBRAIN_INTELLIGENCE_VECTOR_RETRIEVER_HPP
