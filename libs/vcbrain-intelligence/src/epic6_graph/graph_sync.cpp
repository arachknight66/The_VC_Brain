#include "vcbrain/intelligence/epic6_graph/graph_sync.hpp"
#include <spdlog/spdlog.h>
#include <sstream>

namespace vcbrain::intelligence::graph {

void Neo4jGraphSynchronizer::upsert_node(const Node& node) {
    nodes_.push_back(node);
}

void Neo4jGraphSynchronizer::upsert_edge(const Edge& edge) {
    edges_.push_back(edge);
}

std::string Neo4jGraphSynchronizer::generate_cypher_sync_query() const {
    std::stringstream ss;
    for (const auto& n : nodes_) {
        ss << "MERGE (n:" << n.label << " {id: '" << n.node_id << "'}) SET n.name = '" << n.canonical_name << "';\n";
    }
    for (const auto& e : edges_) {
        ss << "MATCH (a {id: '" << e.source_id << "'}), (b {id: '" << e.target_id << "'}) "
           << "MERGE (a)-[r:" << e.relationship_type << " {weight: " << e.weight << "}]->(b);\n";
    }
    return ss.str();
}

double Neo4jGraphSynchronizer::calculate_founder_influence_score(const std::string& person_id) const {
    size_t outbound_degree = 0;
    for (const auto& e : edges_) {
        if (e.source_id == person_id) outbound_degree++;
    }
    return static_cast<double>(outbound_degree) * 0.35 + 0.50;
}

} // namespace vcbrain::intelligence::graph
