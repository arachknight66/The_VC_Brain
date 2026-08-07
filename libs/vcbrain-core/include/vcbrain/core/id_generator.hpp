#ifndef VCBRAIN_CORE_ID_GENERATOR_HPP
#define VCBRAIN_CORE_ID_GENERATOR_HPP

#include <string>
#include <chrono>

namespace vcbrain::core {

struct UUIDv7 {
    std::string value;

    static UUIDv7 generate();
    bool operator==(const UUIDv7& other) const = default;
};

class IDGenerator {
public:
    [[nodiscard]] static std::string new_uuidv7_string();
    [[nodiscard]] static UUIDv7 new_uuidv7();
};

} // namespace vcbrain::core

#endif // VCBRAIN_CORE_ID_GENERATOR_HPP
