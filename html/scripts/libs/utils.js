import * as consts from "./../consts/consts.js";

export default class Utils {
    //
    // API Exposed by the wallet itself
    //
    BEAM = null;
    requestQueue = [];
    requestInProgress = false;
    shiftedReq = {};
    queueTick = 0;
    isInitialized = false;
    currentInterval = null;

    addRequest = (id, method, params, type, priority) => {
        if (type === consts.REQUEST_TYPES.UNIQUE) {
            let itemToRemove = this.requestQueue.find((request) => {
                return request.id === id;
            })
            if (itemToRemove !== undefined) {
                const itemIndex = this.requestQueue.indexOf(itemToRemove);
                this.requestQueue.splice(itemIndex, 1)
            }
        }

        if (priority === consts.REQUEST_PRIORITY.COMMON) {
            this.requestQueue.push({id, method, params, type, priority});
        } else if (priority === consts.REQUEST_PRIORITY.HIGH) {
            this.requestQueue.unshift({id, method, params, type, priority});
        }
    }

    startReqProcessing = () => {
        this.currentInterval = setInterval(() => {
            if (this.requestQueue.length > 0 && !this.requestInProgress) {
                this.shiftedReq = this.requestQueue.shift();
                this.requestInProgress = true;
                this.queueTick = 0;

                Utils.callApi(this.shiftedReq.id, this.shiftedReq.method, this.shiftedReq.params);
            } else if (this.queueTick < 20 && this.requestInProgress) {
                ++this.queueTick;
            } else if (this.queueTick >= 20 && this.requestInProgress && this.shiftedReq.type !== consts.REQUEST_TYPES.DISPOSABLE) {
                this.requestInProgress = false;
                this.requestQueue.unshift(this.shiftedReq);
            }
        }, this.isInitialized ? 500 : 0)
    }

    stopReqProcessing = () => {
        if (this.currentInterval) {
            clearInterval(this.currentInterval);
        }
    }

    finishRequest = () => {
        if (this.requestInProgress) {
            this.shiftedReq = {};
            this.queueTick = 0;
            this.requestInProgress = false;
        }
    }

    static onLoad(cback) {
        window.addEventListener('load', () => new QWebChannel(qt.webChannelTransport, (channel) => {
            Utils.BEAM = channel.objects.BEAM
            this.loadStyles();
            // Notify application
            cback(Utils.BEAM)
        }))
    }

    static loadStyles() {
        let topColor =  [this.BEAM.style.appsGradientOffset, "px,"].join('');
        let mainColor = [this.BEAM.style.appsGradientTop, "px,"].join('');

        $('#bg').css('background-image', [
            "linear-gradient(to bottom,",
            Utils.BEAM.style.background_main_top, topColor, 
            Utils.BEAM.style.background_main, mainColor,
            Utils.BEAM.style.background_main
        ].join(' '));
        document.body.style.color = this.BEAM.style.content_main;
        document.querySelectorAll('.popup').forEach(item => {
            item.style.backgroundImage = `linear-gradient(to bottom, 
                ${this.hex2rgba(this.BEAM.style.background_main_top, 0.6)} ${topColor}
                ${this.hex2rgba(this.BEAM.style.background_main, 0.6)} ${mainColor}
                ${this.hex2rgba(this.BEAM.style.background_main, 0.6)}`;
        });
        document.querySelectorAll('.popup__content').forEach(item => {
            item.style.backgroundColor = this.hex2rgba(this.BEAM.style.background_popup, 1);
        });
    }

    static hex2rgba = (hex, alpha = 1) => {
        const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
        return `rgba(${r},${g},${b},${alpha})`;
    };

    static formateValue(value) {
        if (value > 0) {
            return parseFloat(value.toFixed(2)).toString();
        } else {
            return value;
        }
    }

    static numberWithCommas(x) {
        if (x > 0) {
            return x.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            return x;
        }
    }

    static getRateStr(value, rate) {
        const rateVal = Utils.formateValue(new Big(value).times(rate));
        return (rate > 0 && value > 0
          ? (rateVal > 0.1 ? (Utils.numberWithCommas(rateVal) + ' USD') : '< 1 cent')
          : '0 USD');
    }

    static callApi(callid, method, params) {
        let request = {
            "jsonrpc": "2.0",
            "id":      callid,
            "method":  method,
            "params":  params
        }
        Utils.BEAM.api.callWalletApi(JSON.stringify(request))
    }

    static download(url, cback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if(xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    let buffer    = xhr.response
                    let byteArray = new Uint8Array(buffer);
                    let array     = Array.from(byteArray)

                    if (!array || !array.length) {
                        return cback("empty shader")
                    }
                
                    return cback(null, array)
                } else {
                    let errMsg = ["code", xhr.status].join(" ")
                    return cback(errMsg)
                }
            }
        }
        xhr.open('GET', url, true)
        xhr.responseType = "arraybuffer";
        xhr.send(null)
    }

    static handleString(next) {
        const regex = new RegExp(/^-?\d+(\.\d*)?$/g);
        const floatValue = parseFloat(next);
        const afterDot = next.indexOf('.') > 0 ? next.substring(next.indexOf('.') + 1) : '0';
        if ((next && !String(next).match(regex)) ||
            (String(next).length > 1 && String(next)[0] === '0' && next.indexOf('.') < 0) ||
            (parseInt(afterDot, 10) === 0 && afterDot.length > 7) ||
            (afterDot.length > 8) ||
            (floatValue === 0 && next.length > 1 && next[1] !== '.') ||
            (floatValue < 1 && next.length > 10) ||
            (floatValue > 0 && (floatValue < consts.GLOBAL_CONSTS.MIN_BEAM_AMOUNT 
                    || floatValue > consts.GLOBAL_CONSTS.MAX_BEAM_AMOUNT))) {
          return false;
        }
        return true;
    }
}
