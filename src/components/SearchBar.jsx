import "../styles/SearchBar.css";

function SearchBar() {
  return (
    <div className="search-container">

      <input
        className="search-input"
        type="text"
        placeholder="🔍 Keresés a receptek között..."
      />

    </div>
  );
}

export default SearchBar;