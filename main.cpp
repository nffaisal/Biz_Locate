#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
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
    int disabled_score;
    int transit_score;
    std::string parking_prediction;
    std::string accessibility;
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
        
        std::getline(ss, token, ','); loc.disabled_score = std::stoi(token);
        std::getline(ss, token, ','); loc.transit_score = std::stoi(token);
        std::getline(ss, loc.parking_prediction, ',');
        std::getline(ss, loc.accessibility, ',');
        
        locations.push_back(loc);
    }
    return locations;
}

double calculateScore(const Location& loc, double userMaxRentPerSqft, const std::string& userDemo, const std::string& userType) {
    double score = 0.0;
    
    if (loc.avg_rent_sqft <= userMaxRentPerSqft) {
        score += 50.0;
        score += ((userMaxRentPerSqft - loc.avg_rent_sqft) / userMaxRentPerSqft) * 10.0; 
    } else {
        score -= ((loc.avg_rent_sqft - userMaxRentPerSqft) / userMaxRentPerSqft) * 50.0;
    }

    if (loc.primary_demographic.find(userDemo) != std::string::npos || loc.primary_demographic.find("Mixed") != std::string::npos || loc.primary_demographic.find("General") != std::string::npos) {
        score += 20.0;
    }

    if (loc.suitable_business_types.find(userType) != std::string::npos) {
        score += 30.0;
    }

    if (score > 100.0) score = 100.0;
    return score;
}

std::string toLower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c){ return std::tolower(c); });
    return s;
}

std::string getAIResponse(const std::string& query) {
    std::string q = toLower(query);
    
    if (q.find("noise") != std::string::npos || q.find("sound") != std::string::npos) {
        return "Noise Pollution Solutions: If your chosen area has high noise levels (like Saddar or Board Bazaar), consider installing double-glazed acoustic windows, sound-absorbing acoustic foam panels on the ceiling, and thick drapery. Playing ambient background music inside the store can also effectively mask outside traffic noise.";
    } else if ((q.find("disab") != std::string::npos || q.find("wheelchair") != std::string::npos || q.find("old") != std::string::npos) && (q.find("fix") != std::string::npos || q.find("improve") != std::string::npos || q.find("access") != std::string::npos)) {
        return "Improving Accessibility: To make your store more accessible for disabled or elderly customers, you can: 1) Install a portable aluminum wheelchair ramp if permanent concrete isn't allowed. 2) Ensure aisles are at least 36 inches wide. 3) Use lever-style door handles instead of knobs. 4) Place popular items on lower shelves. 5) Add a clearly marked priority seating area.";
    } else if (q.find("trend") != std::string::npos) {
        return "Market Trend Analysis: Currently in Peshawar, we are seeing a massive shift towards tech-integrated retail and 'aesthetic' cafes, particularly in areas like University Town and DHA. E-commerce integration for brick-and-mortar stores is showing a 40% higher retention rate. We suggest securing a smaller physical footprint but investing heavily in delivery logistics.";
    } else if (q.find("market") != std::string::npos) {
        return "Marketing Strategy Overview: The most effective marketing channel for local businesses right now is short-form video content on TikTok and Instagram Reels targeting the youth demographic (highly active in Hayatabad and University Town). Combine this with localized SEO ('near me' searches) and BRT-station billboard advertising for maximum local penetration.";
    } else if (q.find("competit") != std::string::npos) {
        return "Competitive Landscape: The food and retail sectors in Saddar and Hayatabad are highly saturated. To stand out, you must offer a unique value proposition. Consider niching down (e.g., instead of a general cafe, a specialty matcha bar). In newer sectors like DHA, first-mover advantage is still possible for essential services like clinics and high-end salons.";
    } else if (q.find("disabled") != std::string::npos || q.find("old") != std::string::npos || q.find("access") != std::string::npos) {
        return "Accessibility Insights: If your target demographic includes the elderly or disabled individuals, prioritize locations near BRT stations (like Saddar, University Town, or Board Bazaar) as the BRT system is highly accessible. Additionally, look for newer plazas in Hayatabad and DHA which adhere to modern building codes requiring ramps and elevators. You can also ask me how to *improve* or *fix* accessibility for your specific store!";
    } else if (q.find("dha") != std::string::npos) {
        return "DHA Peshawar Overview: DHA is rapidly developing into a premium commercial hub. Rent is high, but the demographic is strictly high-income. It is ideal for luxury brands, specialized medical clinics, and premium dining. Security and infrastructure are best-in-class.";
    } else if (q.find("hello") != std::string::npos || q.find("hi") != std::string::npos) {
        return "Hello! I am the BizLocate AI Assistant. I can help you with market trends, marketing strategies, competitor analysis, and location-specific insights. What would you like to know about starting your business in Peshawar?";
    }
    
    return "AI Analysis Complete: Based on current data, your query requires a multi-faceted approach. Focus on identifying your core customer base first. Ensure your business model accounts for the projected 8-10% annual rent hikes in premium commercial areas. For a more detailed breakdown, try asking about 'market trends', 'competitors', or 'marketing strategy'.";
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
            double rentAllocation = body.value("rentAllocation", 20.0);
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

            bool exactMatchFound = false;
            for (const auto& rl : ranked) {
                if (rl.score > 0) { 
                    exactMatchFound = true;
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
                    
                    j["disabled_score"] = rl.loc.disabled_score;
                    j["transit_score"] = rl.loc.transit_score;
                    j["parking_prediction"] = rl.loc.parking_prediction;
                    j["accessibility"] = rl.loc.accessibility;
                    
                    j["score"] = rl.score;
                    j["estimated_monthly_rent"] = rl.loc.avg_rent_sqft * spaceSizeSqft;
                    j["is_approximation"] = false;
                    results.push_back(j);
                }
            }

            if (!exactMatchFound && !ranked.empty()) {
                for (size_t i = 0; i < std::min(size_t(3), ranked.size()); ++i) {
                    const auto& rl = ranked[i];
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
                    
                    j["disabled_score"] = rl.loc.disabled_score;
                    j["transit_score"] = rl.loc.transit_score;
                    j["parking_prediction"] = rl.loc.parking_prediction;
                    j["accessibility"] = rl.loc.accessibility;
                    
                    j["score"] = 0.0; 
                    double estRent = rl.loc.avg_rent_sqft * spaceSizeSqft;
                    j["estimated_monthly_rent"] = estRent;
                    j["is_approximation"] = true;
                    j["budget_increase_needed"] = (estRent > maxMonthlyRent) ? (estRent - maxMonthlyRent) : 0;
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

    svr.Post("/api/chat", [&](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");

        try {
            auto body = json::parse(req.body);
            std::string query = body.value("query", "");
            
            std::string responseText = getAIResponse(query);
            
            json out;
            out["response"] = responseText;
            res.set_content(out.dump(), "application/json");
        } catch (const std::exception& e) {
            json err;
            err["error"] = e.what();
            res.status = 400;
            res.set_content(err.dump(), "application/json");
        }
    });

    svr.Options(R"(/api/(recommend|chat))", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.status = 200;
    });

    svr.set_mount_point("/", "./frontend/dist");

    std::cout << "Server starting at http://localhost:8080\n";
    svr.listen("0.0.0.0", 8080);

    return 0;
}
