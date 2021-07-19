import Utils from "./../../libs/utils.js";

class InfoPopupComponent extends HTMLElement {
    componentParams = {
      key: ''
    }

    constructor() {
      super();
    }

    getTemplate() {
        const TEMPLATE =
        `<div class="info-popup">
            some info
        </div>`;

      return TEMPLATE;
    }
  
    render() {
        if (this.componentParams.key.length > 0) {
            this.innerHTML = this.getTemplate();

            
        }
    };
  
    connectedCallback() {
      this.render();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {    
        let value = '';
        switch(name) {
            case 'key':
                this.componentParams.key = newValue;
                $('public-key-popup-component').show();
                this.render();

                break;
        }
    }
  
    
    static get observedAttributes() {
      return ['key'];
    }
  }

  customElements.define('info-popup-component', InfoPopupComponent);
