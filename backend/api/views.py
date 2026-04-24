from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests

def get_coordinates(city_name):
    url = f"https://nominatim.openstreetmap.org/search?q={city_name}&format=json&limit=1"
    headers = {'User-Agent': 'SpotterAssessmentApp/1.0'}
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200 and len(response.json()) > 0:
            data = response.json()[0]
            return float(data['lon']), float(data['lat'])
    except Exception as e:
        print(f"Geocoding error: {e}")
    return None, None

def get_route_data(lon1, lat1, lon2, lat2):
    url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"
    try:
        response = requests.get(url)
        if response.status_code == 200 and response.json().get('code') == 'Ok':
            route = response.json()['routes'][0]
            dist_miles = route['distance'] * 0.000621371
            dur_hours = route['duration'] / 3600
            return dist_miles, dur_hours
    except Exception as e:
        print(f"Routing error: {e}")
    return 0, 0

def generate_hos_logs(time_to_pickup, dist_to_pickup, time_to_dropoff, dist_to_dropoff, cycle_used):
    logs = []
    cycle_remaining = 70.0 - cycle_used
    
    if cycle_remaining <= 0:
        logs.append({"status": 1, "durationHours": 34.0, "note": "34-Hour Restart (Cycle Full)"})
        cycle_remaining = 70.0

    logs.append({"status": 4, "durationHours": 0.25, "note": "Pre-trip inspection"})
    cycle_remaining -= 0.25
    
    def process_driving_leg(drive_time, drive_dist, note_text):
        nonlocal cycle_remaining
        leg_logs = []
        
        avg_speed = drive_dist / drive_time if drive_time > 0 else 60
        time_remaining = drive_time
        dist_remaining = drive_dist
        miles_since_fuel = 0
        continuous_drive = 0
        
        while time_remaining > 0:
            time_to_break = 8.0 - continuous_drive 
            time_to_fuel = (1000.0 - miles_since_fuel) / avg_speed if avg_speed > 0 else 999 
            
            chunk_time = min(time_remaining, time_to_break, time_to_fuel)
            chunk_dist = chunk_time * avg_speed
            
            if chunk_time > 0:
                leg_logs.append({"status": 3, "durationHours": round(chunk_time, 2), "note": note_text})
                time_remaining -= chunk_time
                dist_remaining -= chunk_dist
                continuous_drive += chunk_time
                miles_since_fuel += chunk_dist
                cycle_remaining -= chunk_time
            
            if continuous_drive >= 8.0 and time_remaining > 0.1:
                leg_logs.append({"status": 1, "durationHours": 0.5, "note": "30-minute break"})
                continuous_drive = 0
          
            if miles_since_fuel >= 999.0 and time_remaining > 0.1:
                leg_logs.append({"status": 4, "durationHours": 0.25, "note": "Fuel stop (15 mins)"})
                miles_since_fuel = 0
                cycle_remaining -= 0.25
                continuous_drive = 0 
                
            if cycle_remaining <= 0 and time_remaining > 0.1:
                leg_logs.append({"status": 1, "durationHours": 34.0, "note": "34-Hour Restart"})
                cycle_remaining = 70.0
                continuous_drive = 0

        return leg_logs

    logs.extend(process_driving_leg(time_to_pickup, dist_to_pickup, "Driving to pickup"))
    
    logs.append({"status": 4, "durationHours": 1.0, "note": "Loading at pickup"})
    cycle_remaining -= 1.0
    
    logs.extend(process_driving_leg(time_to_dropoff, dist_to_dropoff, "Driving to dropoff"))
    
    logs.append({"status": 4, "durationHours": 1.0, "note": "Unloading at dropoff"})
  
    logs.append({"status": 2, "durationHours": 10.0, "note": "10-hour Sleep"})
    
    return logs

@api_view(['POST'])
def calculate_route_and_logs(request):
    data = request.data
    
    current_loc = data.get('currentLocation')
    pickup_loc = data.get('pickupLocation')
    dropoff_loc = data.get('dropoffLocation')
    cycle_used = float(data.get('cycleUsed', 0))

    current_coords = get_coordinates(current_loc)
    pickup_coords = get_coordinates(pickup_loc)
    dropoff_coords = get_coordinates(dropoff_loc)

    if not all([current_coords, pickup_coords, dropoff_coords]):
        return Response({"error": "Could not find coordinates for one or more locations."}, status=400)

    dist_to_pickup, time_to_pickup = get_route_data(*current_coords, *pickup_coords)
    dist_to_dropoff, time_to_dropoff = get_route_data(*pickup_coords, *dropoff_coords)

    total_distance = dist_to_pickup + dist_to_dropoff
    total_driving_time = time_to_pickup + time_to_dropoff

    generated_logs = generate_hos_logs(time_to_pickup, dist_to_pickup, time_to_dropoff, dist_to_dropoff, cycle_used)
    
    response_data = {
        "message": "Route calculated successfully!",
        "routeDetails": {
            "totalDistanceMiles": round(total_distance, 2),
            "totalDrivingTimeHours": round(total_driving_time, 2)
        },
        "logs": generated_logs,
   
        "waypoints": [
            [current_coords[1], current_coords[0]], 
            [pickup_coords[1], pickup_coords[0]],   
            [dropoff_coords[1], dropoff_coords[0]]
        ]
    }
    
    return Response(response_data)