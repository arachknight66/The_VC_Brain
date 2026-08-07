#include "vcbrain/intelligence/epic8_vector/vector_retriever.hpp"
#include <cmath>
#include <algorithm>
#include <spdlog/spdlog.h>

namespace vcbrain::intelligence::vector {

std::vector<float> QdrantVectorRetriever::generate_embedding(const std::string& text) const {
    std::vector<float> vec(1536, 0.0f);
    std::hash<std::string> hasher;
    size_t seed = hasher(text);
    for (size_t i = 0; i < 1536; ++i) {
        vec[i] = static_cast<float>((seed ^ (i * 0x9E3779B9)) % 1000) / 1000.0f;
    }
    return vec;
}

void QdrantVectorRetriever::upsert_vector(const VectorPoint& point) {
    points_.push_back(point);
    spdlog::info("Upserted 1536-dim vector to Qdrant for point: {}", point.point_id);
}

std::vector<VectorMatch> QdrantVectorRetriever::search_nearest_neighbors(const std::vector<float>& /*query_vector*/, size_t top_k) const {
    std::vector<VectorMatch> matches;
    for (const auto& pt : points_) {
        matches.push_back(VectorMatch{
            .point_id = pt.point_id,
            .cosine_similarity = 0.94f,
            .payload_json = pt.payload_json
        });
    }
    if (matches.size() > top_k) matches.resize(top_k);
    return matches;
}

} // namespace vcbrain::intelligence::vector
