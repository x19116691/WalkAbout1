import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import PushNotification from 'react-native-push-notification';
import MapView, { Marker } from 'react-native-maps';

// Sample locations of interest in Dublin
const locationsOfInterest = [
  { name: "Trinity College", latitude: 53.3438, longitude: -6.2546, description: "Home of the Book of Kells." },
  { name: "Guinness Storehouse", latitude: 53.3418, longitude: -6.2866, description: "Learn about Dublin’s brewing history." },
  { name: "Dublin Castle", latitude: 53.342686, longitude: -6.267118, description: " The Great castle of dublin."},
];

// Haversine formula for calculating distance between two coordinates
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const App = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    // Configure push notifications
    PushNotification.createChannel(
      {
        channelId: "nearby-locations",
        channelName: "Nearby Locations",
      },
      () => {}
    );

    // Watch the user's location
    const id = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        checkNearbyLocations(latitude, longitude);
      },
      error => Alert.alert("Error", "Unable to get location. Please enable location services."),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );
    setWatchId(id);

    // Cleanup: Stop watching location on component unmount
    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const checkNearbyLocations = (lat, lon) => {
    locationsOfInterest.forEach(location => {
      const distance = haversine(lat, lon, location.latitude, location.longitude);
      if (distance < 0.5) {
        // Notify user about nearby location
        PushNotification.localNotification({
          channelId: "nearby-locations",
          title: "Nearby Location",
          message: `You're near ${location.name}: ${location.description}`,
        });
      }
    });
  };

  return (
    <View style={styles.container}>
      {userLocation ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={userLocation}
            title="You are here"
          />
          {locationsOfInterest.map((location, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              title={location.name}
              description={location.description}
            />
          ))}
        </MapView>
      ) : (
        <Text>Fetching your location...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default App;