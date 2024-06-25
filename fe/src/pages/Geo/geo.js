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
  const [heading, setHeading] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [users, setUsers] = useState({ user1: {}, user2: {}, user3: {} });
  const [userPrime, setUserPrime] = useState(null);

  useEffect(() => {

  }, []);

  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, heading, speed } = position.coords;
          setLat(latitude);
          setLng(longitude);
          setHeading(heading);
          setSpeed(speed);

          try {
            fetch('http://localhost:5000/get_user_info')
            .then(response => response.json())
            .then(data => {
              if (data.isLoggedIn) {
                setUserPrime(data.username);
                fetch("http://localhost:5000/set-location", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    user_id: data.username,  // Use userPrime for the user_id if needed
                    latitude: latitude,
                    longitude: longitude,
                    heading: heading,
                    speed: speed,
                  }),
                });
              }
            })
            .catch(error => console.error('Error fetching user data:', error));
           
          } catch (error) {
            console.error("Error setting user location:", error);
          }
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
  }, [userPrime]);  // Ensure watchPosition updates if userPrime changes

  useEffect(() => {
    const fetchUserLocation = async (userId) => {
      try {
        if (userId === userPrime) {
          return {};
        }

        const response = await fetch(`http://localhost:5000/get-location/${userId}`);
        const data = await response.json();
        return { [userId]: data };
      } catch (error) {
        console.error(`Error fetching user location for ${userId}:`, error);
        return { [userId]: {} };
      }
    };

    const intervalId = setInterval(() => {
      Promise.all([
        fetchUserLocation("user1"),
        fetchUserLocation("user2"),
        fetchUserLocation("user3"),
      ]).then((locations) => {
        const userLocations = locations.reduce(
          (acc, loc) => ({ ...acc, ...loc }),
          {}
        );
        setUsers((prevUsers) => ({ ...prevUsers, ...userLocations }));
      });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [userPrime]);

  return (
    <div style={{ backgroundColor: "white", padding: 72 }}>
      <h1>Coordinates</h1>
      <h4>Pratik you are  {userPrime}</h4>
      {lat !== null && <p>Latitude: {lat}</p>}
      {lng !== null && <p>Longitude: {lng}</p>}
      {heading !== null && <p>Heading: {heading}</p>}
      {speed !== null && <p>Speed: {speed}</p>}

      <div>
        {userPrime !== "user1" && (
          <>
            <h4>User1</h4>
            {users.user1.latitude !== undefined && (
              <p>Latitude: {users.user1.latitude}</p>
            )}
            {users.user1.longitude !== undefined && (
              <p>Longitude: {users.user1.longitude}</p>
            )}
          </>
        )}

        {userPrime !== "user2" && (
          <>
            <h4>User2</h4>
            {users.user2.latitude !== undefined && (
              <p>Latitude: {users.user2.latitude}</p>
            )}
            {users.user2.longitude !== undefined && (
              <p>Longitude: {users.user2.longitude}</p>
            )}
          </>
        )}

        {userPrime !== "user3" && (
          <>
            <h4>User3</h4>
            {users.user3.latitude !== undefined && (
              <p>Latitude: {users.user3.latitude}</p>
            )}
            {users.user3.longitude !== undefined && (
              <p>Longitude: {users.user3.longitude}</p>
            )}
          </>
        )}
      </div>

      <h1>Map</h1>
      {lat && lng && (
        <Map
          height={300}
          defaultCenter={[lat, lng]}
          defaultZoom={19}
          center={[lat, lng]}
        >
          <Marker width={50} anchor={[lat, lng]} />
          {<Marker width={50} anchor={[Number(lat), Number(lng)]} />}
          {userPrime !== "user1" &&
            users.user1.latitude &&
            users.user1.longitude && (
              <Marker
                width={50}
                anchor={[
                  Number(users.user1.latitude),
                  Number(users.user1.longitude),
                ]}
              />
            )}
          {userPrime !== "user2" &&
            users.user2.latitude &&
            users.user2.longitude && (
              <Marker
                width={50}
                anchor={[
                  Number(users.user2.latitude),
                  Number(users.user2.longitude),
                ]}
              />
            )}
          {userPrime !== "user3" &&
            users.user3.latitude &&
            users.user3.longitude && (
              <Marker
                width={50}
                anchor={[
                  Number(users.user3.latitude),
                  Number(users.user3.longitude),
                ]}
              />
            )}
        </Map>
      )}
    </div>
  );
}

export default withStyles(styles)(GeoLocation);
