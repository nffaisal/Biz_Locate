#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <algorithm>
#include "httplib.h"
#include "json.hpp"

using json = nlohmann::json;

struct Location {
    int id;
    std::string name;
    std::string type;
    double avg_rent_sqft;
    std::string primary_demographic;
    std::string suitable_business_types;
    double projected_rent_hike_percent;
    std::string noise_level;
    std::string best_open_time;
    std::string best_close_time;
    std::string description;
};

std::vector<Location> loadLocations(const std::string& filename) {
    std::vector<Location> locations;
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Could not open " << filename << "\n";
        return locations;
    }

    std::string line;
    std::getline(file, line); // Skip header

    while (std::getline(file, line)) {
        std::stringstream ss(line);
        std::string token;
        Location loc;

        std::getline(ss, token, ','); loc.id = std::stoi(token);
        std::getline(ss, loc.name, ',');
        std::getline(ss, loc.type, ',');
        std::getline(ss, token, ','); loc.avg_rent_sqft = std::stod(token);
        std::getline(ss, loc.primary_demographic, ',');
        std::getline(ss, loc.suitable_business_types, ',');
        std::getline(ss, token, ','); loc.projected_rent_hike_percent = std::stod(token);
        std::getline(ss, loc.noise_level, ',');
        std::getline(ss, loc.best_open_time, ',');
        std::getline(ss, loc.best_close_time, ',');
        std::getline(ss, loc.description, ',');
        
        locations.push_back(loc);
    }
    return locations;
}

double calculateScore(const Location& loc, double userMaxRentPerSqft, const std::string& userDemo, const std::string& userType) {
    double score = 0.0;
    
    // Rent factor: if it's within budget, it's a huge plus.
    // The closer it is to the budget, maybe it's more premium, but cheaper is also good.
    // Let's say if rent <= max rent, base score is 50. Then we subtract a penalty if it's too expensive.
    if (loc.avg_rent_sqft <= userMaxRentPerSqft) {
        score += 50.0;
        // Small bonus for being under budget
        score += ((userMaxRentPerSqft - loc.avg_rent_sqft) / userMaxRentPerSqft) * 10.0; 
    } else {
        // Penalty for over budget
        score -= ((loc.avg_rent_sqft - userMaxRentPerSqft) / userMaxRentPerSqft) * 50.0;
    }

    // Demographic factor
    if (loc.primary_demographic.find(userDemo) != std::string::npos || loc.primary_demographic.find("Mixed") != std::string::npos || loc.primary_demographic.find("General") != std::string::npos) {
        score += 20.0;
    }

    // Business type factor
    if (loc.suitable_business_types.find(userType) != std::string::npos) {
        score += 30.0;
    }

    // Cap score
    if (score > 100.0) score = 100.0;
    if (score < 0.0) score = 0.0;

    return score;
}

int main() {
    std::vector<Location> locations = loadLocations("locations.csv");
    std::cout << "Loaded " << locations.size() << " locations.\n";

    httplib::Server svr;

    svr.Post("/api/recommend", [&](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");

        try {
            auto body = json::parse(req.body);
            double budget = body.value("budget", 0.0);
            double rentAllocation = body.value("rentAllocation", 20.0); // percentage
            std::string spaceSizeStr = body.value("spaceSize", "Medium");
            std::string demographic = body.value("demographic", "");
            std::string areaNeed = body.value("areaNeed", "");

            double spaceSizeSqft = 1000.0;
            if (spaceSizeStr == "Small") spaceSizeSqft = 500.0;
            else if (spaceSizeStr == "Large") spaceSizeSqft = 2000.0;

            double maxMonthlyRent = budget * (rentAllocation / 100.0);
            double maxRentPerSqft = maxMonthlyRent / spaceSizeSqft;

            json results = json::array();

            struct RankedLoc { Location loc; double score; };
            std::vector<RankedLoc> ranked;

            for (const auto& loc : locations) {
                double score = calculateScore(loc, maxRentPerSqft, demographic, areaNeed);
                ranked.push_back({loc, score});
            }

            std::sort(ranked.begin(), ranked.end(), [](const RankedLoc& a, const RankedLoc& b) {
                return a.score > b.score;
            });

            for (const auto& rl : ranked) {
                if (rl.score > 0) { // return matches
                    json j;
                    j["id"] = rl.loc.id;
                    j["name"] = rl.loc.name;
                    j["type"] = rl.loc.type;
                    j["avg_rent_sqft"] = rl.loc.avg_rent_sqft;
                    j["primary_demographic"] = rl.loc.primary_demographic;
                    j["suitable_business_types"] = rl.loc.suitable_business_types;
                    j["projected_rent_hike_percent"] = rl.loc.projected_rent_hike_percent;
                    j["noise_level"] = rl.loc.noise_level;
                    j["best_open_time"] = rl.loc.best_open_time;
                    j["best_close_time"] = rl.loc.best_close_time;
                    j["description"] = rl.loc.description;
                    j["score"] = rl.score;
                    j["estimated_monthly_rent"] = rl.loc.avg_rent_sqft * spaceSizeSqft;
                    results.push_back(j);
                }
            }

            res.set_content(results.dump(), "application/json");
        } catch (const std::exception& e) {
            json err;
            err["error"] = e.what();
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        }
    });

    svr.Options("/api/recommend", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.status = 200;
    });

    // Serve frontend build if available
    svr.set_mount_point("/", "./frontend/dist");

    std::cout << "Server starting at http://localhost:8080\n";
    svr.listen("0.0.0.0", 8080);

    return 0;
}
