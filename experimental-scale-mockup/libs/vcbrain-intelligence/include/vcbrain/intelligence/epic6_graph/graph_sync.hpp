#ifndef VCBRAIN_INTELLIGENCE_GRAPH_SYNC_HPP
#define VCBRAIN_INTELLIGENCE_GRAPH_SYNC_HPP

#include <string>
#include <vector>

namespace vcbrain::intelligence::graph {

struct Node {
    std::string node_id;
    std::string label; // Company, Person, Investor, Market, Patent
    std::string canonical_name;
};

struct Edge {
    std::string source_id;
    std::string target_id;
    std::string relationship_type; // FOUNDED_BY, INVESTED_IN, COMPETES_WITH, OPERATES_IN
    double weight{1.0};
};

class Neo4jGraphSynchronizer {
public:
    Neo4jGraphSynchronizer() = default;

    void upsert_node(const Node& node);
    void upsert_edge(const Edge& edge);
    [[nodiscard]] std::string generate_cypher_sync_query() const;
    [[nodiscard]] double calculate_founder_influence_score(const std::string& person_id) const;

private:
    std::vector<Node> nodes_;
    std::vector<Edge> edges_;
};

} // namespace vcbrain::intelligence::graph

#endif // VCBRAIN_INTELLIGENCE_GRAPH_SYNC_HPP
