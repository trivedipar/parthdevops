import { useState, useEffect } from "react";

export default function useGeolocation(options) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();
  const [data, setData] = useState({});

  useEffect(() => {
    const successHandler = (e) => {
      setLoading(false);
      setError(null);
      setData({
        latitude: e.coords.latitude,
        longitude: e.coords.longitude,
        heading: e.coords.heading,
        speed: e.coords.speed
      });
    };

    const errorHandler = (e) => {
      setError(e);
      setLoading(false);
    };

    const id = navigator.geolocation.watchPosition(
      successHandler,
      errorHandler,
      options
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [options]);

  return {
    loading,
    error,
    data,
  };
}
