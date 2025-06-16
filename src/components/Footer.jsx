import React, { useState, useEffect } from "react";

function Footer() {
  const [time, setTime] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let timerId;
    let isMounted = true;

    const startTimer = (initialTime) => {
      if (!isMounted) return;
      setTime(initialTime);
      timerId = setInterval(() => {
        setTime(t => {
          if (t === null) {
            // This can happen if the component is unmounted and remounted quickly.
            // We'll rely on the next fetch to set a proper time.
            clearInterval(timerId);
            return null;
          }
          return new Date(t.getTime() + 1000);
        });
      }, 1000);
    };

    const fetchTime = async () => {
      try {
        const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Manila');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        startTimer(new Date(data.dateTime));
      } catch (e) {
        console.error("Could not fetch time, using local time as fallback.", e);
        setError("Couldn't sync with internet time.");
        if (isMounted) {
          startTimer(new Date());
        }
      }
    };

    fetchTime();

    return () => {
      isMounted = false;
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, []);

  return (
    <div className="sticky bottom-0 left-0 w-full bg-orange-500 text-white text-center py-2 z-50">
      <p className="text-sm">
        {time ? (
          <>
            {time.toLocaleTimeString()} |{" "}
            {time.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {error && <span className="ml-2 text-xs opacity-75">({error})</span>}
          </>
        ) : (
          "Loading time..."
        )}
      </p>
    </div>
  );
}

export default Footer;
