#include "vcbrain/intelligence/epic3_normalization/normalization.hpp"
#include <algorithm>
#include <cctype>
#include <sstream>

namespace vcbrain::intelligence::normalization {

std::string NormalizationEngine::normalize_company_name(const std::string& name) {
    std::string clean = name;
    // Strip trailing Inc., LLC, Ltd., Corp.
    const std::vector<std::string> suffixes = {", Inc.", " Inc.", ", LLC", " LLC", " Ltd.", " Corp."};
    for (const auto& suf : suffixes) {
        if (clean.length() >= suf.length() && clean.compare(clean.length() - suf.length(), suf.length(), suf) == 0) {
            clean = clean.substr(0, clean.length() - suf.length());
        }
    }
    return clean;
}

std::string NormalizationEngine::normalize_domain(const std::string& domain) {
    std::string clean = domain;
    std::transform(clean.begin(), clean.end(), clean.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });
    if (clean.starts_with("https://")) clean = clean.substr(8);
    if (clean.starts_with("http://")) clean = clean.substr(7);
    if (clean.starts_with("www.")) clean = clean.substr(4);
    if (clean.ends_with("/")) clean.pop_back();
    return clean;
}

std::string NormalizationEngine::normalize_founder_name(const std::string& name) {
    std::stringstream ss(name);
    std::string word, result;
    while (ss >> word) {
        if (!word.empty()) {
            word[0] = static_cast<char>(std::toupper(static_cast<unsigned char>(word[0])));
            for (size_t i = 1; i < word.length(); ++i) {
                word[i] = static_cast<char>(std::tolower(static_cast<unsigned char>(word[i])));
            }
            if (!result.empty()) result += " ";
            result += word;
        }
    }
    return result;
}

std::string NormalizationEngine::normalize_currency(double amount, const std::string& currency_code) {
    std::stringstream ss;
    ss << currency_code << " " << std::fixed << amount;
    return ss.str();
}

} // namespace vcbrain::intelligence::normalization
