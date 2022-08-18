(function(window){
    function Promise(executor){
        this.PromiseState = 'pending';
        this.PromiseResult = undefined;
        this.callbacks = [];
        var self = this;

        function resolve(value){
            if(self.PromiseState !== 'pending') return;
            self.PromiseState = 'fulfilled';
            self.PromiseResult = value;
            if(self.callbacks.length > 0){
                self.callbacks.forEach(function(callback){
                    queueMicrotask(()=>{callback.onFulfilled(value);}); // requires the queueMicroTask polyfill
                });
            }
        }

        function reject(reason){
            if(self.PromiseState !== 'pending') return;
            self.PromiseState = 'rejected';
            self.PromiseResult = reason;
            if(self.callbacks.length > 0){
                self.callbacks.forEach(function(callback){
                    queueMicrotask(()=>{callback.onRejected(reason);});
                });
            }
        }

        try{
            executor(resolve, reject);
        }catch(err){
            reject(err);
        }
    }

    Promise.prototype.then = function(onFulfilled, onRejected){
        var self = this;
        onFulfilled = typeof onFulfilled === 'function'? onFulfilled: function(value){return value;};
        onRejected = typeof onRejected === 'function'? onRejected: function(reason){throw reason;}

        return new Promise(function(resolve, reject){
            function executeCallback(callback){
                try{
                    var result = callback(self.PromiseResult);
                    if(result instanceof Promise) result.then(resolve, reject);
                    else resolve(result); 
                }catch(err){
                    reject(err);
                }
            }
            if(self.PromiseState === 'fulfilled') queueMicrotask(()=>{executeCallback(onFulfilled)});
            else if(self.PromiseState === 'rejected') queueMicrotask(()=>{executeCallback(onRejected)});
            else if(self.PromiseState === 'pending'){
                self.callbacks.push({
                    onFulfilled: function(){executeCallback(onFulfilled)},
                    onRejected: function(){executeCallback(onRejected)}
                });
            }
        })
    }

    Promise.prototype.catch = function(onRejected){
        return this.then(undefined, onRejected);
    }

    Promise.resolve = function(value){
        return new Promise(function(resolve, reject){
            if(value instanceof Promise) value.then(function(value){resolve(value);}, function(reason){reject(reason);})
            else resolve(value);
        });
    }

    Promise.reject = function(reason){
        return new Promise(function(resolve, reject){
            reject(reason);
        });
    }

    Promise.all = function(promises){
        var values = [];
        var count = 0;
        return new Promise(function(resolve, reject){
            promises.forEach(function(promise, index){
                promise.then(function(value){
                    count++;
                    values[index] = value;
                    if(count === promises.length) resolve(values);
                }, function(reason){
                    reject(reason);
                });
            });
        });
    }

    Promise.allSettled = function(promises){
        var results = [];
        var count = 0;
        return new Promise(function(resolve, reject){
            promises.forEach(function(promise, index){
                promise.then(function(value){
                    results[index] = {status: 'fulfilled', value: value};
                    count++;
                    if(count === promises.length) resolve(results);
                }, function(reason){
                    results[index] = {status: 'rejected', value: reason};
                    count++;
                    if(count === promises.length) resolve(results);
                });
            });
        });
    }

    Promise.race= function(promises){
        return new Promise(function(resolve, reject){
            for(var i = 0; i < promises.length; i++){
                promise[i].then(function(value){
                    resolve(value);
                }, function(reason){
                    reject(value);
                });
            }
        })
    }

    Promise.any = function(promises){
        var count = 0;
        return new Promise(function(resolve, reject){
            promises.forEach(function(promise, index){
                promise.then(function(value){
                    resolve(value);
                }, function(reason){
                    count++;
                    if(count === promises.length) reject(new Error('No promises fulfilled.'));
                });
            });
        });
    }

    window.Promise = Promise;
})(window)