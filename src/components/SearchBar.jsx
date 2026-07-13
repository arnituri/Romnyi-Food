import "../styles/SearchBar.css";

function SearchBar({ value = "", onSearchChange }) {
  return (
    <div className="search-container">

      <input
        className="search-input"
        type="text"
        aria-label="Receptek keresése"
        placeholder="🔍 Keresés a receptek között..."
        value={value}
        onChange={(event) => onSearchChange?.(event.target.value)}
      />

    </div>
  );
}

export default SearchBar;
