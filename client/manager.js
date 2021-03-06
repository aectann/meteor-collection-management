Meteor.startup(function() {
    _.extend(ManagerType.prototype, {
        /**
         * Create the Meteor stubs for the client.
         * Defines this[meteorCallDefinition] to the call function.
         * @param meteorCallDefinition
         */
        createMeteorCallMethod : function(meteorCallDefinition) {
            var thisManager = this;
            var trackingEventKey;
            if ( typeof(meteorCallDefinition) == "undefined" || meteorCallDefinition ==null) {
                return;
            } else if ( typeof(meteorCallDefinition) === "object") {
                meteorCallNameSuffix = meteorCallDefinition.callName;
                trackingEventKey = meteorCallDefinition.trackingEventKey;
                trackingEventData = meteorCallDefinition.trackingEventData
            } else {
                // assumed meteorCallDefinition is string
                meteorCallNameSuffix = meteorCallDefinition;
            }
            var meteorCallName = this.getMeteorCallName(meteorCallNameSuffix);
            // Create the client function that will call the server-side function with the same name.
            // This allows code to be location agnostic: if the outside code is running on the client: the Meteor call will happen,
            // if it is running on the server - the call will be a direct javascript call.
            if ( trackingEventKey ) {
                thisManager[meteorCallNameSuffix] = function() {
                    TrackingManager && TrackingManager.track(trackingEventKey);
                    return Meteor.apply(meteorCallName, arguments);
                };
            } else {
                thisManager[meteorCallNameSuffix] = function() {
                    var args = Array.prototype.slice.call(arguments);
                    var callback;
                    if ( args.length > 0) {
                        if ( typeof args[args.length-1] == "function") {
                            callback = args.pop();
                        } else {
                            callback = null;
                        }
                    }
                    return Meteor.apply(meteorCallName, args, null, callback);
                };
            }
            // make the underlying Meteor method name available for Meteor libraries that need to know the Meteor call ( like MeteorFile )
            Object.defineProperties(thisManager[meteorCallNameSuffix], {
                meteorCallName : {
                    value : meteorCallName,
                    writable : false
                }
            });
        },
        /**
         * Creates a method this[meteorTopicSuffix] which will subscribe to the topic with the provided arguments and return the subscribe handle.
         * Also attaches to the returned topic handle these functions:
         *     results(),
         *     oneResult(),
         *     and cursor()
         *
         * Most/All topics are created with manager is created
         *
         * Example:
         *
         * AssetManager.createTopic('reportPresentations')
         * (AssetManager.reportPresentationsCursor must exist)
         * causes:
         *
         * AssetManager.reportPresentations function to be created.
         *
         * var subscribeHandle = AssetManager.reportPresentations('34'); // subscribe passing '34' to the server for subscription.
         * subscribeHandle.results(); // return when subscribeHandle.ready() == true call AssetManager.reportPresentationsCursor('34').fetch();
         * subscribeHandle.oneResult(); // return when subscribeHandle.ready() == true call AssetManager.reportPresentationsCursor('34').fetch()[0];
         *
         * @param meteorTopicSuffix
         */
        createTopic : function(meteorTopicSuffix) {
            var thatManager = this;
            var topicName = this.getMeteorTopicName(meteorTopicSuffix);
            // creates the stub subscribe method
            this[meteorTopicSuffix] = function() {
                var passedArguments = Array.prototype.slice.call(arguments, 0);
                var args = Array.prototype.slice.call(arguments, 0);
                args.unshift(topicName);
                var handle = Meteor.subscribe.apply(Meteor,args);
                console.log("subscribing to "+topicName);

                /**
                 *  create a results() function that will return an array of the results.
                 *  This works by calling the manager's cursor function and passing the same arguments that were passed to the subscribe topic.
                 * @returns {*}
                 */
                handle.cursor = function() {
                    var resultsCursor = null;
                    if ( handle.ready() ) {
                        resultsCursor = thatManager.getMeteorTopicCursorFunction(meteorTopicSuffix).apply(thatManager,passedArguments);
                    }
                    return resultsCursor;
                },
                handle.results = function() {
                    var results = null;
                    var resultsCursor = this.cursor();
                    if ( resultsCursor != null ) {
                        results = resultsCursor.fetch();
                    }
                    return results;
                }
                // function that returns only a single result ( if the results are ready)
                handle.oneResult = function() {
                    var results = this.results();
                    if ( results && results.length ) {
                        return results[0];
                    } else {
                        return null;
                    }
                };

                return handle;
            };
        }
    });
    Object.defineProperties(ManagerType.prototype, {
        userId: {
            'get' : function() {
                // always safe on client
                return Meteor.userId();
            }
        }
    });
});
