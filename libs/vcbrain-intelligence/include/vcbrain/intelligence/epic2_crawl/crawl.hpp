#ifndef VCBRAIN_INTELLIGENCE_CRAWL_HPP
#define VCBRAIN_INTELLIGENCE_CRAWL_HPP

#include <string>
#include <vector>
#include <chrono>

namespace vcbrain::intelligence::crawl {

struct CrawlTask {
    std::string task_id;
    std::string target_url;
    uint32_t depth{1};
    std::chrono::system_clock::time_point scheduled_at;
};

struct CrawlSnapshot {
    std::string snapshot_id;
    std::string target_url;
    int http_status_code{200};
    std::string html_content;
    std::string markdown_content;
    std::string content_sha256;
    std::chrono::system_clock::time_point fetched_at;
};

class CrawlOrchestrator {
public:
    CrawlOrchestrator() = default;

    void enqueue_task(CrawlTask task);
    [[nodiscard]] CrawlSnapshot process_next_task();
    [[nodiscard]] size_t pending_queue_size() const noexcept { return queue_.size(); }

private:
    std::vector<CrawlTask> queue_;
};

} // namespace vcbrain::intelligence::crawl

#endif // VCBRAIN_INTELLIGENCE_CRAWL_HPP
