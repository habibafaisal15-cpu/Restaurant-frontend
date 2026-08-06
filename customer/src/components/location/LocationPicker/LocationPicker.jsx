function LocationPicker({ onDetect, onManualSubmit, loading = false }) {
  return (
    <div className="location-picker">
      <h2>Choose your delivery location</h2>
      <p>We will assign the nearest restaurant branch for your order.</p>

      <button type="button" onClick={onDetect} disabled={loading}>
        {loading ? 'Detecting...' : 'Use my current location'}
      </button>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          onManualSubmit?.({
            address: formData.get('address'),
          });
        }}
      >
        <label htmlFor="address">Or enter address manually</label>
        <input id="address" name="address" type="text" required />
        <button type="submit">Continue</button>
      </form>
    </div>
  );
}

export default LocationPicker;
