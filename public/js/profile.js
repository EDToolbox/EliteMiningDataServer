// Profile Page Script

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    loadMiningReports();
});

function loadProfile() {
    // Dummy data, später per API ersetzen
    const profile = {
        name: 'CMDR Example',
        rank: 'Elite',
        credits: 123456789,
        faction: 'Independent',
        ships: [
            { name: 'Python', type: 'Multipurpose', status: 'Bereit' },
            { name: 'Imperial Cutter', type: 'Mining', status: 'Im Hangar' }
        ]
    };
    const container = document.getElementById('profileContent');
    container.innerHTML = `
        <div class="profile-info">
            <strong>Name:</strong> ${profile.name}<br>
            <strong>Rang:</strong> ${profile.rank}<br>
            <strong>Credits:</strong> ${profile.credits.toLocaleString()}<br>
            <strong>Fraktion:</strong> ${profile.faction}<br>
        </div>
        <div class="ships-list">
            <h4>Schiffe:</h4>
            <ul>
                ${profile.ships.map(ship => `<li>${ship.name} (${ship.type}) - ${ship.status}</li>`).join('')}
            </ul>
        </div>
    `;
}

function loadMiningReports() {
    // Dummy data, später per API ersetzen
    const reports = [
        { date: '2025-11-01', system: 'Borann', hotspot: 'Painite', ship: 'Python', yield: '12.5 Mio' },
        { date: '2025-11-03', system: 'Col 285 Sector', hotspot: 'Platinum', ship: 'Imperial Cutter', yield: '18.2 Mio' }
    ];
    const tbody = document.querySelector('#userMiningReports tbody');
    tbody.innerHTML = reports.map(r => `
        <tr>
            <td>${r.date}</td>
            <td>${r.system}</td>
            <td>${r.hotspot}</td>
            <td>${r.ship}</td>
            <td>${r.yield}</td>
        </tr>
    `).join('');
}
