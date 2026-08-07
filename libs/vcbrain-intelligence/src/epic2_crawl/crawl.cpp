#include "vcbrain/intelligence/epic2_crawl/crawl.hpp"
#include "vcbrain/core/id_generator.hpp"
#include <spdlog/spdlog.h>

namespace vcbrain::intelligence::crawl {

void CrawlOrchestrator::enqueue_task(CrawlTask task) {
    queue_.push_back(std::move(task));
}

CrawlSnapshot CrawlOrchestrator::process_next_task() {
    if (queue_.empty()) {
        return CrawlSnapshot{
            .snapshot_id = core::IDGenerator::new_uuidv7_string(),
            .target_url = "about:blank",
            .http_status_code = 404,
            .html_content = "",
            .markdown_content = "",
            .content_sha256 = "",
            .fetched_at = std::chrono::system_clock::now()
        };
    }

    auto task = queue_.front();
    queue_.erase(queue_.begin());

    spdlog::info("CrawlOrchestrator fetching snapshot for URL: {}", task.target_url);

    std::string html = "<html><body><h1>" + task.target_url + "</h1><p>Extracted web content</p></body></html>";
    std::string md = "# " + task.target_url + "\n\nExtracted web content markdown.";

    return CrawlSnapshot{
        .snapshot_id = core::IDGenerator::new_uuidv7_string(),
        .target_url = task.target_url,
        .http_status_code = 200,
        .html_content = html,
        .markdown_content = md,
        .content_sha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        .fetched_at = std::chrono::system_clock::now()
    };
}

} // namespace vcbrain::intelligence::crawl
