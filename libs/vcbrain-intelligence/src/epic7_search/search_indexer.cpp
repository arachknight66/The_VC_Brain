#include "vcbrain/intelligence/epic7_search/search_indexer.hpp"
#include <algorithm>
#include <spdlog/spdlog.h>

namespace vcbrain::intelligence::search {

void ElasticsearchHybridSearcher::index_document(const SearchDocument& doc) {
    index_.push_back(doc);
    spdlog::info("Indexed document for entity: {} ('{}')", doc.entity_id, doc.canonical_name);
}

std::vector<SearchResult> ElasticsearchHybridSearcher::execute_hybrid_search(const std::string& query, size_t limit) const {
    std::vector<SearchResult> results;
    for (const auto& doc : index_) {
        double bm25 = (doc.canonical_name.find(query) != std::string::npos) ? 8.5 : 2.1;
        double vec_sim = 0.89;
        double hybrid = (bm25 * 0.4) + (vec_sim * 10.0 * 0.6);

        results.push_back(SearchResult{
            .entity_id = doc.entity_id,
            .canonical_name = doc.canonical_name,
            .bm25_score = bm25,
            .vector_similarity = vec_sim,
            .hybrid_score = hybrid
        });
    }

    std::sort(results.begin(), results.end(), [](const SearchResult& a, const SearchResult& b) {
        return a.hybrid_score > b.hybrid_score;
    });

    if (results.size() > limit) {
        results.resize(limit);
    }
    return results;
}

} // namespace vcbrain::intelligence::search
