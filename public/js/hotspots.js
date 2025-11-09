// Hotspot Übersicht Script

document.addEventListener('DOMContentLoaded', () => {
    loadHotspots();
    document.getElementById('refreshHotspots').addEventListener('click', loadHotspots);
});

function loadHotspots() {
    // Dummy-Daten, später per API ersetzen
    const hotspots = [
        { system: 'Borann', hotspot: 'Painite', type: 'Ring', coords: 'X:123 Y:456', upload: '2025-11-01', user: 'CMDR Alpha' },
        { system: 'Col 285 Sector', hotspot: 'Platinum', type: 'Ring', coords: 'X:789 Y:321', upload: '2025-11-03', user: 'CMDR Beta' }
    ];
    const tbody = document.querySelector('#hotspotTable tbody');
    tbody.innerHTML = hotspots.map(h => `
        <tr>
            <td>${h.system}</td>
            <td>${h.hotspot}</td>
            <td>${h.type}</td>
            <td>${h.coords}</td>
            <td>${h.upload}</td>
            <td>${h.user}</td>
        </tr>
    `).join('');
}
