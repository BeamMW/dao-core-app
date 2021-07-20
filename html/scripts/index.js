import Utils from "./libs/utils.js";

const CONTRACT_ID = "8cef85a6ed4f2c3ecbbcd0b5b2cf0fd60c3fd863015f38bf725582f26183308c";
const REJECTED_CALL_ID = -32021;
const IN_PROGRESS_ID = 5;
const TIMEOUT = 3000;

class DaoCore {
    constructor() {
        this.timeout = undefined;
        this.pluginData = {
            inTransaction: false,
            lockedDemoX: 0,
            lockedBeams: 0,
            stake: 0,
            inProgress: false,
            mainLoaded: false,
            beamTotalLocked: 0,
            farmTotal: 0,
        }
        window.open('https://codepen.io/micu22/pen/qBNJYZO', '_blank');
    }

    getRate = () => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.coingecko.com/api/v3/simple/price?ids=beam&vs_currencies=usd');
        xhr.send();
        xhr.onload = () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.response);
                if (response.beam !== undefined && response.beam.usd !== undefined) {
                    $('staking-component').attr('rate', response.beam.usd);
                    $('withdraw-popup-component').attr('rate', response.beam.usd);
                    $('deposit-popup-component').attr('rate', response.beam.usd);
                }
            }
        };
    }

    setError = (errmsg) => {
        let errorElementId = "error-common";
        if ($('#main-page').hasClass('hidden')) {
            errorElementId = "error-full";
            $('#error-full-container').show();
        } else {
            $('#error-common').show();
        }

        $(errorElementId).text(errmsg);
        if (this.timeout) {
            clearTimeout(this.timeout);   
        }
        this.timeout = setTimeout(() => {
            $(errorElementId).text(errmsg);
            this.start();
        }, TIMEOUT)
    }

    start = () => {
        Utils.download("./daoCore.wasm", (err, bytes) => {
            if (err) {
                let errTemplate = "Failed to load shader,";
                let errMsg = [errTemplate, err].join(" ");
                return this.setError(errMsg);
            }
    
            Utils.callApi("farm_view", "invoke_contract", {
                contract: bytes,
                create_tx: false,
                args: "role=manager,action=farm_view,cid=" + CONTRACT_ID
            });

            $('public-key-popup-component').hide();
            $('claim-rewards-popup-component').hide();
            $('deposit-popup-component').hide();
            $('withdraw-popup-component').hide();
            $('info-popup-component').hide();

            this.getRate();
            setInterval(() => {
                this.getRate();
            }, 30000);
        })
    }

    loadStake = () => {
        Utils.callApi("view_stake", "invoke_contract", {
            create_tx: false,
            args: "role=manager,action=view_stake,cid=" + CONTRACT_ID
        })
    }
    
    refresh = (now) => {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(() => {
            Utils.callApi("farm_view", "invoke_contract", {
                create_tx: false,
                args: "role=manager,action=farm_view,cid=" + CONTRACT_ID
            })
        }, now ? 0 : 3000)
    }
    
    parseShaderResult = (apiResult) => {
        if (typeof(apiResult.output) != 'string') {
            throw "Empty shader response";
        }
    
        let shaderOut = JSON.parse(apiResult.output)
        if (shaderOut.error) {
            throw ["Shader error: ", shaderOut.error].join("")
        }
    
        return shaderOut;
    }

    showStaking = () => {
        if (!this.pluginData.mainLoaded) {
            this.pluginData.mainLoaded = true;

            $('#main-page').show();
            $('#staking-page').hide();
            $('#staking-page-back').hide();
            $('#error-full-container').hide();
            $('#error-common').hide();
            $('staking-component').attr('loaded', this.pluginData.mainLoaded | 0);
        }
    
        this.refresh(false);
    }

    loadPreallocStats = () => {
        Utils.callApi("prealloc_totals", "invoke_contract", {
            create_tx: false,
            args: "role=manager,action=prealloc_totals,cid=" + CONTRACT_ID
        });
    }

    loadFarmStats = () => {
        Utils.callApi("farm_totals", "invoke_contract", {
            create_tx: false,
            args: "role=manager,action=farm_totals,cid=" + CONTRACT_ID
        });
    }

    loadPreallocated = () => {
        Utils.callApi("prealloc_view", "invoke_contract", {
            create_tx: false,
            args: "role=manager,action=prealloc_view,cid=" + CONTRACT_ID
        });
    }

    onApiResult = (json) => {    
        try {
            const apiAnswer = JSON.parse(json);
            if (apiAnswer.error) {
                if (apiAnswer.error.code == REJECTED_CALL_ID) {
                    return;
                }
                
                throw JSON.stringify(apiAnswer.error)
            }
    
            const apiCallId = apiAnswer.id;
            const apiResult = apiAnswer.result;
            if (!apiResult) {
                throw "Failed to call wallet API";
            }

            if (apiCallId === "farm_view") {
                let shaderOut = this.parseShaderResult(apiResult);
                if (shaderOut.user === undefined) {
                    throw "Failed to farm view";
                }

                const stakingComponent = $('staking-component');
                stakingComponent.attr('beam-value', shaderOut.user.beams_locked);
                stakingComponent.attr('beamx-value', shaderOut.user.beamX);
                
                this.pluginData.lockedDemoX = shaderOut.user.beamX;
                this.pluginData.lockedBeams = shaderOut.user.beams_locked;
                this.loadPreallocated();
            } else if (apiCallId === "farm_update" || apiCallId === "prealloc_withdraw") {
                if (apiResult.raw_data === undefined || apiResult.raw_data.length < 1) {
                    throw 'Failed to load raw data';
                }

                Utils.callApi("process_invoke_data", "process_invoke_data", {
                    data: apiResult.raw_data
                });
                return this.refresh(true);
            } else if (apiCallId === "prealloc_view") {
                let shaderOut = this.parseShaderResult(apiResult);
                if (shaderOut.total !== undefined) {
                    const component = $('allocation-component');
                    component.attr('total', shaderOut.total);
                    component.attr('received', shaderOut.received);
                    component.attr('avail_total', shaderOut.avail_total);
                    component.attr('avail_remaining', shaderOut.avail_remaining);
                }
                this.loadFarmStats();
            } else if (apiCallId === "my_xid") {
                let shaderOut = this.parseShaderResult(apiResult);

                if (shaderOut.xid === undefined) {
                    throw "Failed to load public key";
                }

                $('public-key-popup-component').attr('key', shaderOut.xid);
            } else if (apiCallId === "farm_totals") {
                let shaderOut = this.parseShaderResult(apiResult);
                
                if (shaderOut.total === undefined) {
                    throw "Failed to load farming totals";
                }

                this.pluginData.farmTotal = shaderOut.total;
                this.pluginData.farmAvail = shaderOut.avail;
                this.pluginData.farmReceived = shaderOut.received;

                $('staking-component').attr('beam_total_locked', shaderOut.beam_locked);
                this.loadPreallocStats();
            } else if (apiCallId === "prealloc_totals") {
                let shaderOut = this.parseShaderResult(apiResult);
                
                if (shaderOut.total === undefined) {
                    throw "Failed to load prealloc totals";
                }

                const govComponent = $('governance-component')
                const availTotal = shaderOut.avail + this.pluginData.farmAvail;
                const receivedTotal = shaderOut.received + this.pluginData.farmReceived;
                govComponent.attr('total', shaderOut.total + this.pluginData.farmTotal);
                govComponent.attr('avail', availTotal);
                govComponent.attr('received', receivedTotal);
                govComponent.attr('distributed', availTotal - receivedTotal);

                $('allocation-component').attr('allocated', shaderOut.total);
                this.showStaking();
            } else if (apiCallId === "farm_get_yield") {
                let shaderOut = this.parseShaderResult(apiResult);
                
                if (shaderOut.yield === undefined) {
                    throw "Failed to load yeild";
                }

                const depositComponent = this.pluginData.yieldType === 'deposit' 
                    ? $('deposit-popup-component')
                    : $('staking-component');
                depositComponent.attr('yeild', shaderOut.yield);
            } else if (apiCallId == "process_invoke_data") {
                return this.refresh(true);
            }

            // if (apiCallId == "tx-list") {
            //     if (!Array.isArray(apiResult)) {
            //         throw "Failed to get transactions list";
            //     }

            //     for (let element of apiResult) {
            //         if (element["tx_type_string"] == "contract") {
            //             const ivdata = element["invoke_data"];
            //             let isProgressDetected = false;
            //             for (let data of ivdata) {
            //                 if (data["contract_id"] == CONTRACT_ID) {
            //                     const status = element["status"]
            //                     if (status === IN_PROGRESS_ID) {
            //                         isProgressDetected = true;
            //                         break;
            //                     }
            //                 }
            //             };

            //             if (isProgressDetected) {
            //                 this.pluginData.inProgress = true;
            //                 break;
            //             } else {
            //                 this.pluginData.inProgress = false;
            //             }
            //         }
            //     };
            //     return this.showStaking();
            // }
        } catch(err) {
            return this.setError(err.toString());
        }
    }    
}

Utils.onLoad(async (beamAPI) => {
    let daoCore = new DaoCore();
    $('#error-full-container').css('color', beamAPI.style.validator_error);
    $('#error-common').css('color', beamAPI.style.validator_error);
    beamAPI.api.callWalletApiResult.connect(daoCore.onApiResult);
    daoCore.start();

    document.addEventListener("global-event", (e) => { 
        if (e.detail.type === 'deposit-process') {
            Utils.callApi("farm_update", "invoke_contract", {
                create_tx: false,
                args: "role=manager,action=farm_update,cid=" + CONTRACT_ID + 
                    ",bLockOrUnlock=1,amountBeam=" + e.detail.amount
            });
        } else if (e.detail.type === 'withdraw-process') {
            if (e.detail.is_allocation > 0) {
                Utils.callApi("prealloc_withdraw", "invoke_contract", {
                    create_tx: false,
                    args: "role=manager,action=prealloc_withdraw,cid=" + CONTRACT_ID + 
                        ",amount=" + e.detail.amount
                });
            } else {
                Utils.callApi("farm_update", "invoke_contract", {
                    create_tx: false,
                    args: "role=manager,action=farm_update,cid=" + CONTRACT_ID + 
                        ",bLockOrUnlock=0,amountBeam=" + e.detail.amount
                });
            }
        } else if (e.detail.type === 'show-public-key') {
            Utils.callApi("my_xid", "invoke_contract", {
                create_tx: false,
                args: "role=manager,action=my_xid"
            });
        } else if (e.detail.type === 'claim-rewards-process') {
            if (e.detail.is_allocation > 0) {
                Utils.callApi("prealloc_withdraw", "invoke_contract", {
                    create_tx: false,
                    args: "role=manager,action=prealloc_withdraw,cid=" + CONTRACT_ID + 
                        ",amount=" + e.detail.amount
                });
            } else {
                Utils.callApi("farm_update", "invoke_contract", {
                    create_tx: false,
                    args: "role=manager,action=farm_update,cid=" + CONTRACT_ID + 
                        ",bLockOrUnlock=0,amountBeamX=" + e.detail.amount
                });
            }
        } else if (e.detail.type === 'deposit-popup-open') {
            $('deposit-popup-component').attr('loaded', daoCore.pluginData.mainLoaded | 0);
        } else if (e.detail.type === 'withdraw-popup-open') {
            const component = $('withdraw-popup-component');
            component.attr('is_allocation', e.detail.is_allocation | 0);
            component.attr('max_val', daoCore.pluginData.lockedBeams);
            component.attr('loaded', daoCore.pluginData.mainLoaded | 0);
        } else if (e.detail.type === 'calc-yeild') {
            daoCore.pluginData.yieldType = e.detail.from;
            Utils.callApi("farm_get_yield", "invoke_contract", {
                create_tx: false,
                args: "role=manager,action=farm_get_yield,cid=" + CONTRACT_ID + ",amount=" + 
                    e.detail.amount + ",hPeriod=" + e.detail.hPeriod
            });
        }
    });
});