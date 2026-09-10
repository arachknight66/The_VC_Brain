#include "vcbrain/core/id_generator.hpp"
#include <random>
#include <sstream>
#include <iomanip>

namespace vcbrain::core {

UUIDv7 UUIDv7::generate() {
    static std::random_device rd;
    static std::mt19937_64 gen(rd());
    static std::uniform_int_distribution<uint64_t> dis;

    auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()
    ).count();

    uint64_t rand_a = dis(gen);

    std::stringstream ss;
    ss << std::hex << std::setfill('0')
       << std::setw(12) << now
       << "-"
       << std::setw(4) << ((rand_a >> 48) & 0x0FFF | 0x7000)
       << "-"
       << std::setw(4) << ((rand_a >> 32) & 0x3FFF | 0x8000)
       << "-"
       << std::setw(12) << (rand_a & 0xFFFFFFFFFFFFULL);

    return UUIDv7{ss.str()};
}

std::string IDGenerator::new_uuidv7_string() {
    return UUIDv7::generate().value;
}

UUIDv7 IDGenerator::new_uuidv7() {
    return UUIDv7::generate();
}

} // namespace vcbrain::core
