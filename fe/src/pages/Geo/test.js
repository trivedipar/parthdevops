import React, { useState, useEffect } from "react";
import { Map, Marker } from "pigeon-maps";
import { withStyles } from "@material-ui/core/styles";
import useGeolocation from "./useGeolocation";

const styles = (theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    overflow: "hidden",
    backgroundColor: theme.palette.background.paper,
    marginTop: "100px",
  },
  gridList: {
    width: 500,
    height: 450,
  },
  subheader: {
    width: "100%",
  },
});

function GeoLocation(props) {
  const { loading, error, data } = useGeolocation();
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [hea, setHea] = useState(null);
  const [spd, setSpd] = useState(null);
  const [users, setUsers] = useState({ user1: {}, user2: {}, user3: {} });

  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading, speed } = position.coords;
          setLat(latitude);
          setLng(longitude);
          setHea(heading);
          setSpd(speed);

          // Send location data to the backend
          fetch("http://localhost:5000/set-location", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: "user1", // Assuming this is the current user
              latitude: latitude,
              longitude: longitude,
              heading: heading,
              speed: speed,
            }),
          })
            .then((response) => response.json())
            .then((data) => console.log("User 1 location set:", data))
            .catch((error) => console.error("Error:", error));
        },
        (e) => {
          console.log(e);
        }
      );
    } else {
      console.log("GeoLocation not supported by your browser!");
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  useEffect(() => {
    const fetchUserLocation = (userId) => {
      return fetch(`http://localhost:5000/get-location/${userId}`)
        .then((response) => response.json())
        .then((data) => {
          console.log(`Fetched location for ${userId}:`, data);
          return { [userId]: data };
        })
        .catch((error) => {
          console.error(`Error fetching user location for ${userId}:`, error);
          return { [userId]: {} };
        });
    };

    const intervalId = setInterval(() => {
      Promise.all([
        fetchUserLocation("user2"),
        fetchUserLocation("user3"),
      ]).then((locations) => {
        const userLocations = locations.reduce(
          (acc, loc) => ({ ...acc, ...loc }),
          {}
        );
        console.log("All user locations:", userLocations);
        setUsers((prevUsers) => ({ ...prevUsers, ...userLocations }));
      });
    }, 10000000000000000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    console.log("Users state updated:", users);
  }, [users]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:5000/get-user1-data");
        const userData = await response.json();
        console.log("User1 data:", userData);
        // Use the username as the user_id in the location data payload
        const { username } = userData;
        const locationData = {
          user_id: username,
          latitude,
          longitude,
          heading,
          speed,
        };
        // Send location data to the backend
        fetch("http://localhost:5000/set-location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(locationData),
        })
          .then((response) => response.json())
          .then((data) => console.log("User 1 location set:", data))
          .catch((error) => console.error("Error:", error));
      } catch (error) {
        console.error("Error fetching user1 data:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div style={{ backgroundColor: "white", padding: 72 }}>
      <h1>Coordinates</h1>
      <h4>User1</h4>
      {lat !== null && <p>Latitude: {lat}</p>}
      {lng !== null && <p>Longitude: {lng}</p>}
      {hea !== null && <p>Heading: {hea}</p>}
      {spd !== null && <p>Speed: {spd}</p>}
      <h4>User2</h4>
      {users.user2.latitude !== undefined && (
        <p>Latitude: {users.user2.latitude}</p>
      )}
      {users.user2.longitude !== undefined && (
        <p>Longitude: {users.user2.longitude}</p>
      )}
      <h4>User3</h4>
      {users.user3.latitude !== undefined && (
        <p>Latitude: {users.user3.latitude}</p>
      )}
      {users.user3.longitude !== undefined && (
        <p>Longitude: {users.user3.longitude}</p>
      )}
      <h1>Map</h1>
      {lat &&
        lng &&
        users.user3.latitude &&
        users.user3.longitude &&
        users.user2.latitude &&
        users.user2.longitude && (
          <Map
            height={300}
            defaultCenter={[lat, lng]}
            defaultZoom={12}
            center={[lat, lng]}
          >
            <Marker width={50} anchor={[lat, lng]} />
            <Marker
              width={50}
              anchor={[
                Number(users.user2.latitude),
                Number(users.user2.longitude),
              ]}
            />
            <Marker
              width={50}
              anchor={[
                Number(users.user3.latitude),
                Number(users.user3.longitude),
              ]}
            />
          </Map>
        )}
    </div>
  );
}

export default withStyles(styles)(GeoLocation);
