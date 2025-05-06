export class TipCard {
    constructor(data) {
        this.data = data;
        this.element = this.createCard();
    }

    createCard() {
        const card = document.createElement('div');
        card.className = 'tip-card';
        
        card.innerHTML = `
            <div class="card-header">
                <h3>${this.data.titulo || 'Sin título'}</h3>
                ${this.data.categoria ? `<span class="categoria">${this.data.categoria}</span>` : ''}
            </div>
            <div class="card-body">
                ${this.data.imagen ? `<img src="${this.data.imagen}" alt="${this.data.titulo}">` : ''}
                <p>${this.data.descripcion || ''}</p>
                ${this.data.video ? '<div class="video-indicator">🎥</div>' : ''}
            </div>
        `;

        card.addEventListener('click', () => this.handleClick());
        return card;
    }

    handleClick() {
        // Emitir evento personalizado para manejo externo
        const event = new CustomEvent('tip-selected', { 
            detail: this.data,
            bubbles: true 
        });
        this.element.dispatchEvent(event);
    }
} 