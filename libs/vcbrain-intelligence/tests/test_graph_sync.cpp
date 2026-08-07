#include <gtest/gtest.h>
#include "vcbrain/intelligence/epic6_graph/graph_sync.hpp"

using namespace vcbrain::intelligence::graph;

TEST(Neo4jGraphSynchronizerTest, GeneratesCypherQueryAndCalculatesInfluence) {
    Neo4jGraphSynchronizer sync;
    sync.upsert_node(Node{.node_id = "p_1", .label = "Person", .canonical_name = "Jane Doe"});
    sync.upsert_node(Node{.node_id = "c_1", .label = "Company", .canonical_name = "Acme Systems"});
    sync.upsert_edge(Edge{.source_id = "p_1", .target_id = "c_1", .relationship_type = "FOUNDED"});

    std::string cypher = sync.generate_cypher_sync_query();
    EXPECT_NE(cypher.find("MERGE (a {id: 'p_1'})"), std::string::npos);

    double influence = sync.calculate_founder_influence_score("p_1");
    EXPECT_GE(influence, 0.85);
}
