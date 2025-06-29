document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DO DOM ---
    const appointmentForm = document.getElementById('appointment-form');
    const appointmentDateInput = document.getElementById('appointment-date');
    const appointmentHourSelect = document.getElementById('appointment-hour');
    const filterDateInput = document.getElementById('filter-date');
    const filterOwnerInput = document.getElementById('filter-owner');
    const photoInput = document.getElementById('pet-photo-input');
    const photoPreview = document.getElementById('photo-preview');

    const DEFAULT_PET_PHOTO = "https://i.imgur.com/TlaVx2s.png";

    // --- CONFIGURAÇÃO INICIAL ---
    const setupInitialValues = () => {
        // Define data mínima como hoje
        const today = new Date().toISOString().split('T')[0];
        appointmentDateInput.setAttribute('min', today);
        filterDateInput.setAttribute('min', today);
        filterDateInput.value = today;

        // Preenche o seletor de horas (das 06h às 23h)
        for (let i = 6; i <= 23; i++) {
            const hour = i.toString().padStart(2, '0');
            const option = new Option(`${hour}:00`, hour);
            appointmentHourSelect.add(option);
        }
    };

    // --- FUNÇÕES DE DADOS (localStorage) ---
    const getAppointments = () => JSON.parse(localStorage.getItem('appointments')) || [];
    const saveAppointments = (appointments) => localStorage.setItem('appointments', JSON.stringify(appointments));

    // --- FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO ---
    const renderAppointments = () => {
        const allAppointments = getAppointments();
        const filterDate = filterDateInput.value;
        const ownerFilter = filterOwnerInput.value.toLowerCase();

        const morningList = document.getElementById('morning-appointments');
        const afternoonList = document.getElementById('afternoon-appointments');
        const nightList = document.getElementById('night-appointments');

        [morningList, afternoonList, nightList].forEach(list => list.innerHTML = '');

        const filteredAppointments = allAppointments.filter(app => {
            return app.date === filterDate && app.ownerName.toLowerCase().includes(ownerFilter);
        });

        const appointmentsByHour = filteredAppointments.reduce((acc, app) => {
            const hour = app.hour;
            if (!acc[hour]) acc[hour] = [];
            acc[hour].push(app);
            return acc;
        }, {});

        const sortedHours = Object.keys(appointmentsByHour).sort((a, b) => a - b);

        if (sortedHours.length === 0) {
            const emptyMsg = '<li class="empty-message">Nenhum agendamento encontrado.</li>';
            [morningList, afternoonList, nightList].forEach(list => list.innerHTML = emptyMsg);
            return;
        }

        let hasMorning = false, hasAfternoon = false, hasNight = false;

        sortedHours.forEach(hour => {
            const appointmentsInHour = appointmentsByHour[hour];
            const slotsTaken = appointmentsInHour.length;
            const slotsAvailable = 5 - slotsTaken;

            const groupContainer = document.createElement('li');
            groupContainer.className = 'appointment-hour-group';

            const hourHeader = `
                <div class="hour-header">
                    <span>Horário: ${hour}h</span>
                    <span class="slots-info">${slotsAvailable} vagas restantes</span>
                </div>`;
            
            const appointmentsHTML = appointmentsInHour.map(app => `
                <div class="appointment-item">
                    <img src="${app.petPhoto || DEFAULT_PET_PHOTO}" alt="Foto do Pet" class="appointment-pet-photo">
                    <div class="appointment-details">
                        <span><strong>Pet:</strong> ${app.petName}</span>
                        <span><strong>Dono:</strong> ${app.ownerName}</span>
                    </div>
                    <button class="delete-btn" data-id="${app.id}">Excluir</button>
                </div>
            `).join('');

            groupContainer.innerHTML = hourHeader + appointmentsHTML;

            const numericHour = parseInt(hour);
            if (numericHour < 12) { morningList.appendChild(groupContainer); hasMorning = true; }
            else if (numericHour < 18) { afternoonList.appendChild(groupContainer); hasAfternoon = true; }
            else { nightList.appendChild(groupContainer); hasNight = true; }
        });

        if (!hasMorning) morningList.innerHTML = '<li class="empty-message">Nenhum agendamento para este período.</li>';
        if (!hasAfternoon) afternoonList.innerHTML = '<li class="empty-message">Nenhum agendamento para este período.</li>';
        if (!hasNight) nightList.innerHTML = '<li class="empty-message">Nenhum agendamento para este período.</li>';
        
        addDeleteEventListeners();
    };

    // --- FUNÇÕES DE EVENTOS ---
    const addDeleteEventListeners = () => {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteAppointment(e.target.dataset.id));
        });
    };

    const handlePhotoPreview = () => {
        const file = photoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => { photoPreview.src = e.target.result; };
            reader.readAsDataURL(file);
        }
    };

    const addAppointment = (e) => {
        e.preventDefault();
        const allAppointments = getAppointments();
        
        const newAppointment = {
            id: Date.now().toString(),
            petName: document.getElementById('pet-name').value,
            ownerName: document.getElementById('owner-name').value,
            date: document.getElementById('appointment-date').value,
            hour: document.getElementById('appointment-hour').value,
            petPhoto: photoPreview.src // Salva a imagem em Base64
        };

        const appointmentsInHour = allAppointments.filter(app => 
            app.date === newAppointment.date && app.hour === newAppointment.hour
        );

        if (appointmentsInHour.length >= 5) {
            alert(`Limite de 5 agendamentos atingido para as ${newAppointment.hour}h do dia ${newAppointment.date}. Por favor, escolha outro horário.`);
            return;
        }

        allAppointments.push(newAppointment);
        saveAppointments(allAppointments);

        appointmentForm.reset();
        photoPreview.src = DEFAULT_PET_PHOTO; // Reseta a foto para a padrão
        document.getElementById('appointment-date').value = ''; 
        filterDateInput.value = newAppointment.date;
        renderAppointments();
    };

    const deleteAppointment = (id) => {
        let allAppointments = getAppointments();
        allAppointments = allAppointments.filter(app => app.id !== id);
        saveAppointments(allAppointments);
        renderAppointments();
    };

    // --- INICIALIZAÇÃO E LISTENERS ---
    setupInitialValues();
    photoInput.addEventListener('change', handlePhotoPreview);
    appointmentForm.addEventListener('submit', addAppointment);
    filterDateInput.addEventListener('change', renderAppointments);
    filterOwnerInput.addEventListener('input', renderAppointments);
    renderAppointments();
});