#ifndef VCBRAIN_INTELLIGENCE_SEARCH_INDEXER_HPP
#define VCBRAIN_INTELLIGENCE_SEARCH_INDEXER_HPP

#include <string>
#include <vector>

namespace vcbrain::intelligence::search {

struct SearchDocument {
    std::string entity_id;
    std::string canonical_name;
    std::string description;
    std::string domain;
    double page_rank_score{1.0};
};

struct SearchResult {
    std::string entity_id;
    std::string canonical_name;
    double bm25_score;
    double vector_similarity;
    double hybrid_score;
};

class ElasticsearchHybridSearcher {
public:
    ElasticsearchHybridSearcher() = default;

    void index_document(const SearchDocument& doc);
    [[nodiscard]] std::vector<SearchResult> execute_hybrid_search(const std::string& query, size_t limit = 10) const;

private:
    std::vector<SearchDocument> index_;
};

} // namespace vcbrain::intelligence::search

#endif // VCBRAIN_INTELLIGENCE_SEARCH_INDEXER_HPP
