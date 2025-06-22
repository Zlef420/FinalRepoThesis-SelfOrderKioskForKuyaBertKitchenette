import React, { useState, useEffect } from "react";

function Footer() {
  const [time, setTime] = useState(new Date());
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchTime = async (attempt = 1) => {
    if (attempt === 1) {
      setIsFetching(true);
      setError(null);
    }

    try {
      const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Manila');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setTime(new Date(data.dateTime));
      setError(null);
      setIsFetching(false);
    } catch (e) {
      console.error(`Attempt ${attempt}: Could not fetch time.`, e.message);
      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => fetchTime(attempt + 1), delay);
      } else {
        setError("Sync failed. Using local time.");
        setIsFetching(false);
      }
    }
  };

  useEffect(() => {
    fetchTime(1);
    
    const timerId = setInterval(() => {
      setTime(prevTime => new Date(prevTime.getTime() + 1000));
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="sticky bottom-0 left-0 w-full bg-orange-500 text-white text-center py-2 z-50 flex items-center justify-center">
      <p className="text-sm">
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
      </p>
      {error && (
        <button 
          onClick={() => fetchTime(1)} 
          disabled={isFetching}
          className="ml-4 text-xs bg-white text-orange-500 px-2 py-1 rounded disabled:opacity-50"
        >
          {isFetching ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  );
}

export default Footer;
