// Estado da aplicação
let isEditMode = false;
let menuData = {};

// Dados padrão
const DEFAULT_MEALS = ["Desjejum", "Colação", "Almoço", "Lanche", "Refeição da Tarde"];
const DEFAULT_DAYS = ["Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira"];

const THEME_PRESETS = {
    verde: { primary: "#16a34a", accent: "#84cc16" },
    laranja: { primary: "#ea580c", accent: "#f59e0b" },
    azul: { primary: "#2563eb", accent: "#22d3ee" },
    roxo: { primary: "#7c3aed", accent: "#a78bfa" }
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    setupEventListeners();
    updateEditableElements();
    initializeTheme();
});

// Configuração dos event listeners
function setupEventListeners() {
    // Botões principais (usando classes e onclick já definidos no HTML)
    // Os event listeners já estão definidos via onclick no HTML
    
    // Seletor de tema (usando onclick no HTML)
    
    // Input de importação é tratado via atributo onchange no HTML (importData(event))
    // Removido addEventListener duplicado para evitar ReferenceError em alguns navegadores
    // const importFile = document.getElementById('import-file');
    // if (importFile && typeof importData === 'function') {
    //     importFile.addEventListener('change', importData);
    // }
    
    // Event listeners para elementos editáveis
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(element => {
        element.addEventListener('blur', saveCurrentData);
        element.addEventListener('input', handleInput);
        element.addEventListener('keydown', handleKeyDown);
    });

    // Event listener para fechar modal ao clicar fora
    document.addEventListener('click', function(e) {
        const printModal = document.getElementById('printModal');
        if (e.target === printModal) {
            closePrintModal();
        }
    });
    
    // Event listener para ESC fechar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const printModal = document.getElementById('printModal');
            if (printModal && printModal.style.display === 'flex') {
                closePrintModal();
            }
        }
    });
    
    // Event listener para beforeunload desabilitado para evitar erros
    // window.addEventListener('beforeunload', function(e) {
    //     if (hasUnsavedChanges()) {
    //         e.preventDefault();
    //         e.returnValue = 'Você tem alterações não salvas. Deseja sair mesmo assim?';
    //     }
    // });
    
    // Auto-save quando sair do modo de edição
    document.addEventListener('blur', function(e) {
        if (isEditMode && (e.target.contentEditable === 'true' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) {
            saveData();
        }
    }, true);
}

// Alternar modo de edição
function toggleEditMode() {
    isEditMode = !isEditMode;
    document.body.classList.toggle('edit-mode', isEditMode);
    updateEditableElements();
    
    const editBtn = document.querySelector('.btn-edit');
    const editIcon = editBtn.querySelector('i');
    const editText = editBtn.childNodes[editBtn.childNodes.length - 1];
    const controlButtons = document.querySelectorAll('.control-btn:not(.btn-edit):not(.btn-print)');
    
    if (isEditMode) {
        editIcon.className = 'fas fa-eye';
        editText.textContent = ' Modo Visualização';
        editBtn.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
        controlButtons.forEach(btn => btn.style.display = 'inline-flex');
        showNotification('Modo de edição ativado! Clique nos campos para editar.', 'success');
    } else {
        editIcon.className = 'fas fa-edit';
        editText.textContent = ' Modo Edição';
        editBtn.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
        controlButtons.forEach(btn => btn.style.display = 'none');
        saveData();
        showNotification('Modo de visualização ativado.', 'info');
    }
}

// Função de impressão - abre modal de opções
function printMenu() {
    // Salvar dados antes de abrir modal
    saveCurrentData();
    
    // Preencher campos do modal com dados atuais
    const currentAgeRange = document.getElementById('ageRangeSelect').value;
    const currentWeekRange = document.querySelector('.date-range').textContent;
    
    document.getElementById('printAgeRange').value = currentAgeRange;
    document.getElementById('printWeekRange').value = currentWeekRange;
    
    // Mostrar modal
    document.getElementById('printModal').style.display = 'flex';
}

// Função para fechar modal de impressão
function closePrintModal() {
    document.getElementById('printModal').style.display = 'none';
}

// Função para confirmar impressão com opções selecionadas
function confirmPrint() {
    const selectedAgeRange = document.getElementById('printAgeRange').value;
    const selectedWeekRange = document.getElementById('printWeekRange').value;
    const useCurrentData = document.getElementById('printCurrentData').checked;
    
    // Fechar modal
    closePrintModal();
    
    // Salvar valores originais
    const originalAgeRange = document.getElementById('ageRangeSelect').value;
    const originalWeekRange = document.querySelector('.date-range').textContent;
    const originalTitle = document.title;
    
    // Aplicar configurações temporárias se não usar dados atuais
    if (!useCurrentData) {
        // Atualizar faixa etária temporariamente
        document.getElementById('ageRangeSelect').value = selectedAgeRange;
        updateAgeRange(selectedAgeRange);
        
        // Atualizar período temporariamente
        document.querySelector('.date-range').textContent = selectedWeekRange;
    }
    
    // Desativar modo de edição temporariamente
    const wasEditMode = isEditMode;
    if (isEditMode) {
        document.body.classList.remove('edit-mode');
    }
    
    // Configurar título para impressão
    const unitName = document.querySelector('.unit-name').textContent || 'CEI Girassol';
    const printWeekRange = document.querySelector('.date-range').textContent;
    document.title = `${unitName} - ${printWeekRange}`;
    
    // Imprimir
    window.print();
    
    // Restaurar configurações originais
    document.title = originalTitle;
    if (wasEditMode) {
        document.body.classList.add('edit-mode');
    }
    
    // Restaurar dados originais se foram alterados
    if (!useCurrentData) {
        document.getElementById('ageRangeSelect').value = originalAgeRange;
        updateAgeRange(originalAgeRange);
        document.querySelector('.date-range').textContent = originalWeekRange;
    }
    
    showNotification('Cardápio enviado para impressão!', 'success');
}

// Função para inicializar tema
function initializeTheme() {
    const savedTheme = localStorage.getItem('ceiGirassolTheme') || 'verde';
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
    applyTheme(savedTheme);
}

// Função para mudar tema
function changeTheme(value) {
    const selectedTheme = value || document.getElementById('theme-select').value;
    applyTheme(selectedTheme);
    localStorage.setItem('ceiGirassolTheme', selectedTheme);
    showNotification(`Tema ${selectedTheme} aplicado!`, 'success');
}

// Função para aplicar tema
function applyTheme(themeName) {
    const theme = THEME_PRESETS[themeName];
    if (theme) {
        document.documentElement.style.setProperty('--theme-primary', theme.primary);
        document.documentElement.style.setProperty('--theme-accent', theme.accent);
    }
}

// Função para adicionar linha de refeição
function addMealRow() {
    const mealName = prompt('Nome da nova refeição:');
    if (!mealName) return;
    
    const tbody = document.querySelector('#menu-table tbody');
    const newRow = document.createElement('tr');
    
    // Cabeçalho da refeição
    const mealHeader = document.createElement('td');
    mealHeader.className = 'meal-header';
    mealHeader.innerHTML = `<span contenteditable="true">${mealName}</span>`;
    newRow.appendChild(mealHeader);
    
    // Células para cada dia
    const dayHeaders = document.querySelectorAll('#menu-table thead th:not(:first-child)');
    dayHeaders.forEach((_, index) => {
        const cell = document.createElement('td');
        cell.className = 'meal-cell';
        cell.dataset.day = `day-${index}`;
        cell.dataset.meal = mealName.toLowerCase().replace(/\s+/g, '-');
        
        cell.innerHTML = `
            <div class="meal-content">
                <div class="meal-section">
                    <div class="meal-label">Itens / Preparos</div>
                    <textarea class="meal-items" placeholder="Digite os itens e preparos..."></textarea>
                </div>
                <div class="meal-section">
                    <div class="meal-label">Fruta</div>
                    <input type="text" class="meal-fruit-input" placeholder="Digite a fruta...">
                </div>
            </div>
        `;
        newRow.appendChild(cell);
    });
    
    tbody.appendChild(newRow);
    updateEditableElements();
    showNotification(`Refeição "${mealName}" adicionada!`, 'success');
}

// Função para adicionar coluna de dia
function addDayColumn() {
    const dayName = prompt('Nome do novo dia:');
    if (!dayName) return;
    
    // Adicionar cabeçalho
    const thead = document.querySelector('#menu-table thead tr');
    const newHeader = document.createElement('th');
    newHeader.className = 'day-header';
    newHeader.innerHTML = `<span contenteditable="true">${dayName}</span>`;
    thead.appendChild(newHeader);
    
    // Adicionar células para cada refeição
    const rows = document.querySelectorAll('#menu-table tbody tr');
    rows.forEach((row, rowIndex) => {
        const cell = document.createElement('td');
        cell.className = 'meal-cell';
        cell.dataset.day = dayName.toLowerCase().replace(/\s+/g, '-');
        cell.dataset.meal = `meal-${rowIndex}`;
        
        cell.innerHTML = `
            <div class="meal-content">
                <div class="meal-section">
                    <div class="meal-label">Itens / Preparos</div>
                    <textarea class="meal-items" placeholder="Digite os itens e preparos..."></textarea>
                </div>
                <div class="meal-section">
                    <div class="meal-label">Fruta</div>
                    <input type="text" class="meal-fruit-input" placeholder="Digite a fruta...">
                </div>
            </div>
        `;
        row.appendChild(cell);
    });
    
    updateEditableElements();
    showNotification(`Dia "${dayName}" adicionado!`, 'success');
}

// Função para limpar semana
function clearWeek() {
    if (!confirm('Tem certeza que deseja limpar todos os dados da semana? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    // Limpar campos de texto
    const textareas = document.querySelectorAll('.meal-items');
    const inputs = document.querySelectorAll('.meal-fruit-input');
    
    textareas.forEach(textarea => textarea.value = '');
    inputs.forEach(input => input.value = '');
    
    showNotification('Semana limpa com sucesso!', 'success');
}

// Função para navegar para a semana anterior
function previousWeek() {
    const dateRange = document.querySelector('.date-range');
    if (!dateRange) return;
    
    const currentText = dateRange.textContent;
    const dateMatch = currentText.match(/(\d{2})\/(\d{2})\/(\d{4})\s+a\s+(\d{2})\/(\d{2})\/(\d{4})/);
    
    if (dateMatch) {
        const startDate = new Date(dateMatch[3], dateMatch[2] - 1, dateMatch[1]);
        const endDate = new Date(dateMatch[6], dateMatch[5] - 1, dateMatch[4]);
        
        // Subtrair 7 dias
        startDate.setDate(startDate.getDate() - 7);
        endDate.setDate(endDate.getDate() - 7);
        
        const newStartStr = formatDate(startDate);
        const newEndStr = formatDate(endDate);
        
        dateRange.textContent = `Data: ${newStartStr} a ${newEndStr}`;
        saveData();
        showNotification('Navegado para semana anterior', 'info');
    }
}

// Função para navegar para a próxima semana
function nextWeek() {
    const dateRange = document.querySelector('.date-range');
    if (!dateRange) return;
    
    const currentText = dateRange.textContent;
    const dateMatch = currentText.match(/(\d{2})\/(\d{2})\/(\d{4})\s+a\s+(\d{2})\/(\d{2})\/(\d{4})/);
    
    if (dateMatch) {
        const startDate = new Date(dateMatch[3], dateMatch[2] - 1, dateMatch[1]);
        const endDate = new Date(dateMatch[6], dateMatch[5] - 1, dateMatch[4]);
        
        // Adicionar 7 dias
        startDate.setDate(startDate.getDate() + 7);
        endDate.setDate(endDate.getDate() + 7);
        
        const newStartStr = formatDate(startDate);
        const newEndStr = formatDate(endDate);
        
        dateRange.textContent = `Data: ${newStartStr} a ${newEndStr}`;
        saveData();
        showNotification('Navegado para próxima semana', 'info');
    }
}

// Função para formatar data
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Cardápios pré-definidos por faixa etária
const AGE_RANGE_MENUS = {
    'de 0 a 5 meses': {
        'Segunda-Feira': {
            'Desjejum': { items: 'Café da manhã', fruit: '' },
            'Colação': { items: 'Leite materno ou fórmula', fruit: '' },
            'Almoço': { items: 'Leite materno ou fórmula', fruit: '' },
            'Lanche': { items: 'Leite materno ou fórmula', fruit: '' },
            'Refeição da Tarde': { items: 'Leite materno ou fórmula', fruit: '' }
        },
        'Terça-Feira': {
            'Desjejum': { items: 'Café da manhã', fruit: '' },
            'Colação': { items: 'Leite materno ou fórmula', fruit: '' },
            'Almoço': { items: 'Leite materno ou fórmula', fruit: '' },
            'Lanche': { items: 'Leite materno ou fórmula', fruit: '' },
            'Refeição da Tarde': { items: 'Leite materno ou fórmula', fruit: '' }
        },
        'Quarta-Feira': {
            'Desjejum': { items: 'Café da manhã', fruit: '' },
            'Colação': { items: 'Leite materno ou fórmula', fruit: '' },
            'Almoço': { items: 'Leite materno ou fórmula', fruit: '' },
            'Lanche': { items: 'Leite materno ou fórmula', fruit: '' },
            'Refeição da Tarde': { items: 'Leite materno ou fórmula', fruit: '' }
        },
        'Quinta-Feira': {
             'Desjejum': { items: 'Café da manhã', fruit: '' },
            'Colação': { items: 'Leite materno ou fórmula', fruit: '' },
            'Almoço': { items: 'Leite materno ou fórmula', fruit: '' },
            'Lanche': { items: 'Leite materno ou fórmula', fruit: '' },
            'Refeição da Tarde': { items: 'Leite materno ou fórmula', fruit: '' }
        },
        'Sexta-Feira': {
             'Desjejum': { items: 'Café da manhã', fruit: '' },
            'Colação': { items: 'Leite materno ou fórmula', fruit: '' },
            'Almoço': { items: 'Leite materno ou fórmula', fruit: '' },
            'Lanche': { items: 'Leite materno ou fórmula', fruit: '' },
            'Refeição da Tarde': { items: 'Leite materno ou fórmula', fruit: '' }
        }
    },
    'de 6 meses': {
         'Segunda-Feira': {
             'Desjejum': { items: 'Café da manhã', fruit: '' },
            'Colação': { items: 'Papa de frutas', fruit: 'Banana amassada' },
            'Almoço': { items: 'Papa salgada: batata, cenoura e frango desfiado', fruit: '' },
            'Lanche': { items: 'Leite materno ou fórmula', fruit: '' },
            'Refeição da Tarde': { items: 'Papa salgada: abóbora e carne moída', fruit: '' }
        },
        'Terça-Feira': {
             'Desjejum': { items: 'Café da manhã', fruit: '' },
            'Colação': { items: 'Papa de frutas', fruit: 'Maçã raspada' },
            'Almoço': { items: 'Papa salgada: mandioquinha, abobrinha e peixe', fruit: '' },
            'Lanche': { items: 'Leite materno ou fórmula', fruit: '' },
            'Refeição da Tarde': { items: 'Papa salgada: batata doce e frango', fruit: '' }
        },
        'Quarta-Feira': {
             'Desjejum': { items: 'Café da manhã', fruit: '' },
            'Colação': { items: 'Papa de frutas', fruit: 'Pera amassada' },
            'Almoço': { items: 'Papa salgada: arroz, brócolis e carne', fruit: '' },
            'Lanche': { items: 'Leite materno ou fórmula', fruit: '' },
            'Refeição da Tarde': { items: 'Papa salgada: inhame e frango desfiado', fruit: '' }
        },
        'Quinta-Feira': {
             'Desjejum': { items: 'Café da manhã', fruit: '' },
            'Colação': { items: 'Papa de frutas', fruit: 'Mamão amassado' },
            'Almoço': { items: 'Papa salgada: macarrão, couve-flor e peixe', fruit: '' },
            'Lanche': { items: 'Leite materno ou fórmula', fruit: '' },
            'Refeição da Tarde': { items: 'Papa salgada: mandioca e carne moída', fruit: '' }
        },
        'Sexta-Feira': {
             'Desjejum': { items: 'Café da manhã', fruit: '' },
            'Colação': { items: 'Papa de frutas', fruit: 'Banana com maçã' },
            'Almoço': { items: 'Papa salgada: quinoa, cenoura e frango', fruit: '' },
            'Lanche': { items: 'Leite materno ou fórmula', fruit: '' },
            'Refeição da Tarde': { items: 'Papa salgada: abóbora e peixe desfiado', fruit: '' }
        }
    },
    'de 7 a 11 meses': {
        'Segunda-Feira': {
            'Desjejum': { items: 'Mingau de aveia', fruit: 'Banana' },
            'Colação': { items: 'Biscoito de polvilho', fruit: 'Maçã' },
            'Almoço': { items: 'Arroz, feijão, frango desfiado, cenoura refogada', fruit: '' },
            'Lanche': { items: 'Iogurte natural', fruit: 'Pera' },
            'Refeição da Tarde': { items: 'Sopa de legumes com carne moída', fruit: '' }
        },
        'Terça-Feira': {
            'Desjejum': { items: 'Mingau de fubá', fruit: 'Mamão' },
            'Colação': { items: 'Pão caseiro', fruit: 'Banana' },
            'Almoço': { items: 'Macarrão, molho de tomate, peixe, abobrinha', fruit: '' },
            'Lanche': { items: 'Vitamina de frutas', fruit: 'Maçã' },
            'Refeição da Tarde': { items: 'Purê de batata com frango desfiado', fruit: '' }
        },
        'Quarta-Feira': {
            'Desjejum': { items: 'Mingau de tapioca', fruit: 'Pera' },
            'Colação': { items: 'Bolacha maria', fruit: 'Mamão' },
            'Almoço': { items: 'Arroz, lentilha, carne moída, brócolis', fruit: '' },
            'Lanche': { items: 'Suco natural', fruit: 'Banana' },
            'Refeição da Tarde': { items: 'Polenta com molho de carne', fruit: '' }
        },
        'Quinta-Feira': {
            'Desjejum': { items: 'Mingau de milho', fruit: 'Maçã' },
            'Colação': { items: 'Biscoito caseiro', fruit: 'Pera' },
            'Almoço': { items: 'Risoto de frango com legumes', fruit: '' },
            'Lanche': { items: 'Leite com achocolatado', fruit: 'Mamão' },
            'Refeição da Tarde': { items: 'Sopa de mandioquinha com peixe', fruit: '' }
        },
        'Sexta-Feira': {
            'Desjejum': { items: 'Mingau de quinoa', fruit: 'Banana' },
            'Colação': { items: 'Pão integral', fruit: 'Maçã' },
            'Almoço': { items: 'Arroz, feijão preto, frango, couve refogada', fruit: '' },
            'Lanche': { items: 'Iogurte com frutas', fruit: 'Pera' },
            'Refeição da Tarde': { items: 'Nhoque de batata com molho de carne', fruit: '' }
        }
    },
    'de 1 a 4 anos': {
        'Segunda-Feira': {
            'Desjejum': { items: 'Pão integral, requeijão, leite', fruit: 'Banana' },
            'Colação': { items: 'Biscoito integral, suco natural', fruit: 'Maçã' },
            'Almoço': { items: 'Arroz, feijão, bife grelhado, salada de tomate', fruit: '' },
            'Lanche': { items: 'Iogurte, granola', fruit: 'Pera' },
            'Refeição da Tarde': { items: 'Macarrão ao molho bolonhesa, salada verde', fruit: '' }
        },
        'Terça-Feira': {
            'Desjejum': { items: 'Cereal matinal, leite, mel', fruit: 'Mamão' },
            'Colação': { items: 'Pão de forma, geleia, suco', fruit: 'Banana' },
            'Almoço': { items: 'Arroz, feijão, frango assado, purê de batata', fruit: '' },
            'Lanche': { items: 'Vitamina de frutas', fruit: 'Maçã' },
            'Refeição da Tarde': { items: 'Sopa de legumes com carne, pão integral', fruit: '' }
        },
        'Quarta-Feira': {
            'Desjejum': { items: 'Tapioca com queijo, leite', fruit: 'Pera' },
            'Colação': { items: 'Bolacha água e sal, suco', fruit: 'Mamão' },
            'Almoço': { items: 'Arroz, lentilha, peixe grelhado, legumes refogados', fruit: '' },
            'Lanche': { items: 'Achocolatado, biscoito', fruit: 'Banana' },
            'Refeição da Tarde': { items: 'Polenta com molho de frango, salada', fruit: '' }
        },
        'Quinta-Feira': {
            'Desjejum': { items: 'Pão francês, manteiga, leite com achocolatado', fruit: 'Maçã' },
            'Colação': { items: 'Bolo caseiro, suco natural', fruit: 'Pera' },
            'Almoço': { items: 'Arroz, feijão, carne moída, abobrinha refogada', fruit: '' },
            'Lanche': { items: 'Iogurte natural, mel', fruit: 'Mamão' },
            'Refeição da Tarde': { items: 'Lasanha de legumes, salada de alface', fruit: '' }
        },
        'Sexta-Feira': {
            'Desjejum': { items: 'Mingau de aveia, leite', fruit: 'Banana' },
            'Colação': { items: 'Sanduíche natural, suco', fruit: 'Maçã' },
            'Almoço': { items: 'Arroz, feijão, frango grelhado, brócolis no vapor', fruit: '' },
            'Lanche': { items: 'Smoothie de frutas', fruit: 'Pera' },
            'Refeição da Tarde': { items: 'Risoto de legumes com carne, salada mista', fruit: '' }
        }
    }
};

// Função para atualizar faixa etária
function updateAgeRange(value) {
    // Aplicar cardápio correspondente à faixa etária
    applyAgeRangeMenu(value);
    
    saveData();
    showNotification(`Faixa etária alterada para: ${value}`, 'success');
}

// Função para aplicar cardápio baseado na faixa etária
function applyAgeRangeMenu(ageRange) {
    const menuData = AGE_RANGE_MENUS[ageRange];
    if (!menuData) return;
    
    // Aplicar dados do cardápio para cada dia e refeição
    Object.keys(menuData).forEach(day => {
        Object.keys(menuData[day]).forEach(meal => {
            const mealData = menuData[day][meal];
            
            // Seleciona diretamente a célula correspondente ao dia e refeição
            const cell = document.querySelector(`[data-day="${day}"][data-meal="${meal}"]`);
            if (cell) {
                const mealFoodsDiv = cell.querySelector('.meal-foods');
                const mealFruitSpan = cell.querySelector('.meal-fruit span');
                
                // Preenche os campos visuais corretos
                if (mealFoodsDiv) mealFoodsDiv.textContent = mealData.items || '';
                if (mealFruitSpan) mealFruitSpan.textContent = mealData.fruit || '';
            }
        });
    });
    
    showNotification(`Cardápio aplicado para: ${ageRange}`, 'success');
}

// Salvar dados
function saveData() {
    try {
        const unitNameEl = document.querySelector('.unit-name');
        const dateRangeEl = document.querySelector('.date-range');
        const ageRangeEl = document.getElementById('ageRangeSelect');
        const observationsEl = document.querySelector('.observation-content');
        const themeEl = document.getElementById('theme-select');
        
        const data = {
            unitName: unitNameEl ? unitNameEl.textContent : 'CEI Girassol',
            weekDate: dateRangeEl ? dateRangeEl.textContent : '',
            ageRange: ageRangeEl ? ageRangeEl.value : 'de 7 a 11 meses',
            observations: observationsEl ? observationsEl.textContent : '',
            theme: themeEl ? themeEl.value : 'verde',
            menuItems: {}
        };
        
        // Salvar itens do menu
        const menuCells = document.querySelectorAll('.meal-cell');
        menuCells.forEach(cell => {
            const day = cell.dataset.day;
            const meal = cell.dataset.meal;
            
            if (!data.menuItems[day]) {
                data.menuItems[day] = {};
            }
            
            const mealFoodsDiv = cell.querySelector('.meal-foods');
            const mealFruitSpan = cell.querySelector('.meal-fruit span');
            
            data.menuItems[day][meal] = {
                items: mealFoodsDiv ? mealFoodsDiv.textContent : '',
                fruit: mealFruitSpan ? mealFruitSpan.textContent : ''
            };
        });
        
        localStorage.setItem('ceiGirassolMenu', JSON.stringify(data));
        showNotification('Dados salvos com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showNotification('Erro ao salvar dados. Tente novamente.', 'error');
    }
}

// Salvar dados atuais no localStorage
function saveCurrentData() {
    const unitNameEl = document.querySelector('.unit-name');
    const dateRangeEl = document.querySelector('.date-range');
    const ageRangeEl = document.getElementById('ageRangeSelect');
    const observationsEl = document.querySelector('.observation-content');
    
    const data = {
            unitName: unitNameEl ? unitNameEl.textContent : 'CEI Girassol',
            dateRange: dateRangeEl ? dateRangeEl.textContent : '',
            ageGroup: ageRangeEl ? ageRangeEl.value : 'de 7 a 11 meses',
            observations: observationsEl ? observationsEl.innerHTML : '',
            meals: {},
            lastSaved: new Date().toISOString()
        };
    
    // Salvar dados das refeições
    const mealCells = document.querySelectorAll('.meal-cell');
    mealCells.forEach(cell => {
        const day = cell.dataset.day;
        const meal = cell.dataset.meal;
        const mealType = cell.querySelector('.meal-type').textContent;
        const mealFoods = cell.querySelector('.meal-foods').textContent;
        const mealFruit = cell.querySelector('.meal-fruit span').textContent;
        
        if (!data.meals[day]) {
            data.meals[day] = {};
        }
        
        data.meals[day][meal] = {
            type: mealType,
            foods: mealFoods,
            fruit: mealFruit
        };
    });
    
    localStorage.setItem('ceiGirassolMenu', JSON.stringify(data));
    menuData = data;
}

// Carregar dados salvos
function loadSavedData() {
    try {
        const savedData = localStorage.getItem('ceiGirassolMenu');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Carregar dados do cabeçalho
            if (data.unitName && document.querySelector('.unit-name')) {
                document.querySelector('.unit-name').textContent = data.unitName;
            }
            if (data.weekDate && document.querySelector('.date-range')) {
                document.querySelector('.date-range').textContent = data.weekDate;
            }
            if (data.ageRange && document.getElementById('ageRangeSelect')) {
                document.getElementById('ageRangeSelect').value = data.ageRange;
            }
            if (data.observations && document.querySelector('.observation-content')) {
                document.querySelector('.observation-content').textContent = data.observations;
            }
            if (data.theme && document.getElementById('theme-select')) {
                document.getElementById('theme-select').value = data.theme;
                applyTheme(data.theme);
            }
            
            // Carregar itens do menu
            if (data.menuItems) {
                Object.keys(data.menuItems).forEach(day => {
                    Object.keys(data.menuItems[day]).forEach(meal => {
                        const cell = document.querySelector(`[data-day="${day}"][data-meal="${meal}"]`);
                        if (cell) {
                            const item = data.menuItems[day][meal];
                            
                            const mealFoodsDiv = cell.querySelector('.meal-foods');
                            const mealFruitSpan = cell.querySelector('.meal-fruit span');
                            
                            if (mealFoodsDiv) mealFoodsDiv.textContent = item.items || '';
                            if (mealFruitSpan) mealFruitSpan.textContent = item.fruit || '';
                        }
                    });
                });
            }
            
            menuData = data;
            
            // Mostrar quando foi salvo pela última vez
            if (data.lastSaved) {
                const lastSaved = new Date(data.lastSaved);
                const timeAgo = getTimeAgo(lastSaved);
                showNotification(`Dados carregados (salvos ${timeAgo})`, 'info');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados salvos:', error);
        showNotification('Erro ao carregar dados salvos.', 'error');
    }
}

// Verificar se há mudanças não salvas
function hasUnsavedChanges() {
    // Função completamente desabilitada para evitar erros de DOM
    // Removido getCurrentData() que causava TypeError
    return false;
}

// Obter dados atuais
function getCurrentData() {
    const unitNameEl = document.querySelector('.unit-name');
    const dateRangeEl = document.querySelector('.date-range');
    const ageRangeSelectEl = document.querySelector('#ageRangeSelect');
    const observationsEl = document.querySelector('.observation-content');
    
    const data = {
        unitName: unitNameEl ? unitNameEl.textContent : '',
        dateRange: dateRangeEl ? dateRangeEl.textContent : '',
        ageGroup: ageRangeSelectEl ? ageRangeSelectEl.value : '',
        observations: observationsEl ? observationsEl.innerHTML : '',
        meals: {}
    }
    
    const mealCells = document.querySelectorAll('.meal-cell');
    mealCells.forEach(cell => {
        const day = cell.dataset.day;
        const meal = cell.dataset.meal;
        const mealTypeEl = cell.querySelector('.meal-type');
        const mealFoodsEl = cell.querySelector('.meal-foods');
        const fruitEl = cell.querySelector('.meal-fruit span');
        
        if (day && meal) {
            if (!data.meals[day]) {
                data.meals[day] = {};
            }
            
            data.meals[day][meal] = {
                type: mealTypeEl ? (mealTypeEl.textContent || '') : '',
                foods: mealFoodsEl ? (mealFoodsEl.textContent || '') : '',
                fruit: fruitEl ? (fruitEl.textContent || '') : ''
            };
        }
    });
    
    return data;
}

// Manipular entrada de texto
function handleInput(event) {
    const element = event.target;
    
    // Auto-save após 2 segundos de inatividade
    clearTimeout(element.autoSaveTimeout);
    element.autoSaveTimeout = setTimeout(() => {
        saveCurrentData();
    }, 2000);
    
    // Validação de conteúdo
    if (element.classList.contains('meal-foods')) {
        validateMealContent(element);
    }
}

// Manipular teclas especiais
function handleKeyDown(event) {
    const element = event.target;
    
    // Salvar com Ctrl+S
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveData();
        return;
    }
    
    // Navegar com Tab
    if (event.key === 'Tab') {
        event.preventDefault();
        navigateToNextField(element, event.shiftKey);
    }
    
    // Quebra de linha com Shift+Enter
    if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        document.execCommand('insertHTML', false, '<br>');
    }
}

// Navegar para o próximo campo editável
function navigateToNextField(currentElement, reverse = false) {
    const editableElements = Array.from(document.querySelectorAll('[contenteditable="true"]'));
    const currentIndex = editableElements.indexOf(currentElement);
    
    let nextIndex;
    if (reverse) {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : editableElements.length - 1;
    } else {
        nextIndex = currentIndex < editableElements.length - 1 ? currentIndex + 1 : 0;
    }
    
    editableElements[nextIndex].focus();
}

// Validar conteúdo das refeições
function validateMealContent(element) {
    const content = element.textContent.trim();
    
    // Remover classe de erro anterior
    element.classList.remove('validation-error');
    
    // Validação básica
    if (content.length > 200) {
        element.classList.add('validation-error');
        showNotification('Conteúdo muito longo. Máximo 200 caracteres.', 'warning');
    }
}

// Atualizar elementos editáveis
function updateEditableElements() {
    const editableElements = document.querySelectorAll('[contenteditable]');
    const inputElements = document.querySelectorAll('.meal-items, .meal-fruit-input');
    
    editableElements.forEach(element => {
        element.contentEditable = isEditMode;
        if (isEditMode) {
            element.classList.add('editable');
        } else {
            element.classList.remove('editable');
        }
        
        // Adicionar indicador visual quando vazio
        if (!element.textContent.trim()) {
            element.classList.add('empty-field');
        } else {
            element.classList.remove('empty-field');
        }
    });
    
    inputElements.forEach(element => {
        element.disabled = !isEditMode;
        if (isEditMode) {
            element.classList.add('editable');
        } else {
            element.classList.remove('editable');
        }
    });
}

// Sistema de notificações
function showNotification(message, type = 'info') {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Adicionar estilos da notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
        font-family: 'Poppins', sans-serif;
    `;
    
    // Estilos do conteúdo da notificação
    const style = document.createElement('style');
    style.textContent = `
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
            opacity: 0.7;
            transition: opacity 0.2s;
        }
        .notification-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Obter ícone da notificação
function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Obter cor da notificação
function getNotificationColor(type) {
    const colors = {
        success: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
        error: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
        warning: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
        info: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)'
    };
    return colors[type] || colors.info;
}

// Calcular tempo decorrido
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'há poucos segundos';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
    return `há ${Math.floor(diffInSeconds / 86400)} dias`;
}

// Funcionalidades de exportação/importação
function exportData() {
    const data = {
        unitName: (document.querySelector('.unit-name') || {}).textContent || 'CEI Girassol',
        weekDate: (document.querySelector('.date-range') || {}).textContent || '',
        ageRange: (document.getElementById('ageRangeSelect') || {}).value || 'de 7 a 11 meses',
        observations: (document.querySelector('.observation-content') || {}).textContent || '',
        theme: document.getElementById('theme-select') ? document.getElementById('theme-select').value : 'verde',
        menuItems: {}
    };
    
    // Coletar dados do menu
    const menuCells = document.querySelectorAll('.meal-cell');
    menuCells.forEach(cell => {
        const day = cell.dataset.day;
        const meal = cell.dataset.meal;
        
        if (!data.menuItems[day]) {
            data.menuItems[day] = {};
        }
        
        const mealFoodsDiv = cell.querySelector('.meal-foods');
        const mealFruitSpan = cell.querySelector('.meal-fruit span');
        
        data.menuItems[day][meal] = {
            items: mealFoodsDiv ? mealFoodsDiv.textContent : '',
            fruit: mealFruitSpan ? mealFruitSpan.textContent : ''
        };
    });
    
    // Criar e baixar arquivo
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardapio-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Dados exportados com sucesso!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            // Opção de mesclagem: só preenche campos vazios
            const merge = !!(document.getElementById('merge-import') && document.getElementById('merge-import').checked);

            // Carregar dados do cabeçalho na UI atual
            if (data.unitName && document.querySelector('.unit-name')) document.querySelector('.unit-name').textContent = data.unitName;
            if (data.weekDate && document.querySelector('.date-range')) document.querySelector('.date-range').textContent = data.weekDate;
            if (data.ageRange && document.getElementById('ageRangeSelect')) document.getElementById('ageRangeSelect').value = data.ageRange;
            if (data.observations && document.querySelector('.observation-content')) document.querySelector('.observation-content').textContent = data.observations;
            if (data.theme && document.getElementById('theme-select')) {
                document.getElementById('theme-select').value = data.theme;
                applyTheme(data.theme);
            }

            let applied = 0, skipped = 0, invalid = 0;
            const errors = [];

            // Validar e carregar itens do menu (semana atual)
            if (data.menuItems && typeof data.menuItems === 'object') {
                const validDays = Array.isArray(DEFAULT_DAYS) ? DEFAULT_DAYS : ["Segunda-Feira","Terça-Feira","Quarta-Feira","Quinta-Feira","Sexta-Feira"];
                const validMeals = Array.isArray(DEFAULT_MEALS) ? DEFAULT_MEALS : ["Desjejum","Colação","Almoço","Lanche","Refeição da Tarde"];

                Object.keys(data.menuItems).forEach(day => {
                    if (!validDays.includes(day)) { errors.push(`Dia inválido: ${day}`); invalid++; return; }
                    const mealsObj = data.menuItems[day];
                    if (!mealsObj || typeof mealsObj !== 'object') { errors.push(`Formato inválido para o dia: ${day}`); invalid++; return; }

                    Object.keys(mealsObj).forEach(meal => {
                        if (!validMeals.includes(meal)) { errors.push(`Refeição inválida em ${day}: ${meal}`); invalid++; return; }
                        const cell = document.querySelector(`[data-day="${day}"][data-meal="${meal}"]`);
                        if (!cell) { errors.push(`Célula não encontrada para ${day} / ${meal}`); invalid++; return; }
                        const item = mealsObj[meal] || {};
                        const mealFoodsDiv = cell.querySelector('.meal-foods');
                        const mealFruitSpan = cell.querySelector('.meal-fruit span');

                        if ('items' in item) {
                            const newFoods = item.items || '';
                            if (mealFoodsDiv) {
                                const currentFoods = (mealFoodsDiv.textContent || '').trim();
                                if (merge && currentFoods) {
                                    skipped++;
                                } else {
                                    mealFoodsDiv.textContent = newFoods;
                                    applied++;
                                }
                            }
                        }

                        if ('fruit' in item) {
                            const newFruit = item.fruit || '';
                            if (mealFruitSpan) {
                                const currentFruit = (mealFruitSpan.textContent || '').trim();
                                if (merge && currentFruit) {
                                    skipped++;
                                } else {
                                    mealFruitSpan.textContent = newFruit;
                                    applied++;
                                }
                            }
                        }
                    });
                });
            }

            saveData();

            if (errors.length) {
                const details = errors.slice(0, 6).join(' | ');
                showNotification(`Importação concluída com avisos. Aplicados: ${applied}, Ignorados: ${skipped}, Inválidos: ${invalid}. Detalhes: ${details}${errors.length > 6 ? ' ...' : ''}`, 'warning');
            } else {
                showNotification(`Dados importados com sucesso! Aplicados: ${applied}${skipped ? `, Ignorados: ${skipped}` : ''}.`, 'success');
            }
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            showNotification('Erro ao importar arquivo. Verifique se o formato está correto.', 'error');
        }
    };

    reader.readAsText(file);
    event.target.value = '';
}

// Carregar dados de um objeto
function loadDataFromObject(data) {
    if (data.unitName) document.querySelector('.unit-name').textContent = data.unitName;
    if (data.dateRange) document.querySelector('.date-range').textContent = data.dateRange;
    if (data.ageGroup && document.getElementById('ageRangeSelect')) document.getElementById('ageRangeSelect').value = data.ageGroup;
    if (data.observations) document.querySelector('.observation-content').innerHTML = data.observations;
    
    if (data.meals) {
        Object.keys(data.meals).forEach(day => {
            Object.keys(data.meals[day]).forEach(meal => {
                const cell = document.querySelector(`[data-day="${day}"][data-meal="${meal}"]`);
                if (cell) {
                    const mealData = data.meals[day][meal];
                    if (mealData.type) cell.querySelector('.meal-type').textContent = mealData.type;
                    if (mealData.foods) cell.querySelector('.meal-foods').textContent = mealData.foods;
                    if (mealData.fruit) cell.querySelector('.meal-fruit span').textContent = mealData.fruit;
                }
            });
        });
    }
    
    saveCurrentData();
}

// Adicionar funcionalidade de busca
function searchMenu(query) {
    const cells = document.querySelectorAll('.meal-cell');
    const searchTerm = query.toLowerCase();
    
    cells.forEach(cell => {
        const content = cell.textContent.toLowerCase();
        if (content.includes(searchTerm)) {
            cell.style.background = '#fff3cd';
            cell.style.border = '2px solid #ffc107';
        } else {
            cell.style.background = '';
            cell.style.border = '';
        }
    });
}

// Limpar busca
function clearSearch() {
    const cells = document.querySelectorAll('.meal-cell');
    cells.forEach(cell => {
        cell.style.background = '';
        cell.style.border = '';
    });
}

// Adicionar tooltips informativos
function addTooltips() {
    const tooltips = {
        '.btn-edit': 'Alternar modo de edição (Ctrl+E)',
        '.btn-print': 'Imprimir cardápio (Ctrl+P)',
        '.btn-save': 'Salvar alterações (Ctrl+S)',
        '.btn-export': 'Exportar dados para JSON',
        '.btn-import': 'Importar dados de JSON',
        '#merge-import': 'Se marcado, só preenche campos vazios ao importar'
    };
    Object.keys(tooltips).forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.title = tooltips[selector];
        }
    });
}