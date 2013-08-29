var RequestEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var responseModel = model.get("response");
        var view = this;
        var body = model.get("body");

        this.requestMetaViewer = new RequestMetaViewer({model: this.model});
        this.requestMethodEditor = new RequestMethodEditor({model: this.model});
        this.requestHeaderEditor = new RequestHeaderEditor({model: this.model});
        this.requestURLEditor = new RequestURLEditor({model: this.model});
        this.requestBodyEditor = new RequestBodyEditor({model: this.model});
        this.requestClipboard = new RequestClipboard({model: this.model});
        this.requestPreviewer = new RequestPreviewer({model: this.model});

        model.on("loadRequest", this.onLoadRequest, this);
        model.on("sentRequest", this.onSentRequest, this);
        model.on("startNew", this.onStartNew, this);
        model.on("updateModel", this.updateModel, this);

        responseModel.on("failedRequest", this.onFailedRequest, this);
        responseModel.on("finishedLoadResponse", this.onFinishedLoadResponse, this);

        this.on("send", this.onSend, this);
        this.on("preview", this.onPreview, this);

        $("#update-request-in-collection").on("click", function () {
            view.updateModel();

            var current = model.getAsObject();
            var collectionRequest = {
                id: model.get("collectionRequestId"),
                url: current.url,
                data: current.data,
                headers: current.headers,
                dataMode: current.dataMode,
                method: current.method,
                version: current.version,
                time: new Date().getTime()
            };

            pm.collections.updateCollectionRequest(collectionRequest);
        });

        $("#cancel-request").on("click", function () {
            model.trigger("cancelRequest", model);
        });

        $("#request-actions-reset").on("click", function () {
            model.trigger("startNew", model);
        });

        $('#add-to-collection').on("click", function () {
            view.updateModel();
        });

        $("#submit-request").on("click", function () {
            view.trigger("send", "text");
        });

        $("#submit-request-download").on("click", function () {
            view.trigger("send", "arraybuffer", "download");
        });

        $("#write-tests").on("click", function () {
            pm.mediator.trigger("showTestWriter", model);
        });

        $("#preview-request").on("click", function () {
            _.bind(view.onPreviewRequestClick, view)();
        });


        $('body').on('keydown', 'input', function (event) {
            if(pm.app.isModalOpen()) {
                return;
            }

            if (event.keyCode === 27) {
                $(event.target).blur();
            }
            else if (event.keyCode === 13) {
                view.trigger("send", view);
            }

            return true;
        });


        $(document).bind('keydown', 'return', function () {
            if(pm.app.isModalOpen()) {
                return;
            }

            view.trigger("send", "text");
            return false;
        });

        var newRequestHandler = function () {
            if(pm.app.isModalOpen()) {
                return;
            }

            model.trigger("startNew", model);
        };


        $(document).bind('keydown', 'alt+p', function() {
            _.bind(view.onPreviewRequestClick, view)();
        });

        $(document).bind('keydown', 'alt+n', newRequestHandler);

        this.loadLastSavedRequest();
    },

    loadLastSavedRequest: function() {
        var lastRequest = pm.settings.getSetting("lastRequest");

        // TODO Have a generic function for falsy values
        if (lastRequest !== "" && lastRequest !== undefined) {

            var lastRequestParsed = JSON.parse(lastRequest);
            // TODO Be able to set isFromCollection too
            this.model.set("isFromCollection", false);
            pm.mediator.trigger("loadRequest", lastRequestParsed, false, false);
        }
    },

    onStartNew: function() {
        // TODO Needs to be handled by the Sidebar
        $('.sidebar-collection-request').removeClass('sidebar-collection-request-active');
        $('#update-request-in-collection').css("display", "none");
    },

    updateModel: function() {
        this.requestHeaderEditor.updateModel();
        this.requestURLEditor.updateModel();
        this.requestBodyEditor.updateModel();
    },

    onSend: function(type, action) {
        if (!type) {
            type = "text";
        }

        if (!action) {
            action = "display";
        }

        this.updateModel();
        this.model.trigger("send", type, action);
    },

    onPreview: function() {
        this.updateModel();
        pm.mediator.trigger("showPreview");
    },

    onSentRequest: function() {
        $('#submit-request').button("loading");
    },

    onFailedRequest: function() {
        $('#submit-request').button("reset");
    },

    onFinishedLoadResponse: function() {
        $('#submit-request').button("reset");
    },

    onLoadRequest: function(m) {
        var model = this.model;
        var body = model.get("body");
        var method = model.get("method");
        var isMethodWithBody = model.isMethodWithBody(method);
        var url = model.get("url");
        var headers = model.get("headers");
        var data = model.get("data");
        var name = model.get("name");
        var description = model.get("description");
        var responses = model.get("responses");
        var isFromSample = model.get("isFromSample");
        var isFromCollection = model.get("isFromCollection");

        this.showRequestBuilder();

        if (isFromCollection) {
            $('#update-request-in-collection').css("display", "inline-block");
            $('#write-tests').css("display", "inline-block");
        }
        else if (isFromSample) {
            $('#update-request-in-collection').css("display", "inline-block");
            $('#write-tests').css("display", "inline-block");
        }
        else {
            $('#update-request-in-collection').css("display", "none");
            $('#write-tests').css("display", "none");
        }

        $('#headers-keyvaleditor-actions-open .headers-count').html(headers.length);

        $('#url').val(url);

        var newUrlParams = getUrlVars(url, false);

        //@todoSet params using keyvalueeditor function
        $('#url-keyvaleditor').keyvalueeditor('reset', newUrlParams);
        $('#headers-keyvaleditor').keyvalueeditor('reset', headers);

        $('#request-method-selector').val(method);

        if (isMethodWithBody) {
            $('#data').css("display", "block");
        }
        else {
            $('#data').css("display", "none");
        }
    },

    showRequestBuilder: function() {
        $("#preview-request").html("Preview");
        this.model.set("editorMode", 0);
        $("#request-builder").css("display", "block");
        $("#request-preview").css("display", "none");
    },

    // TODO Implement this using events
    onPreviewRequestClick: function(event) {
        var editorMode = this.model.get("editorMode");
        if(editorMode === 1) {
            this.showRequestBuilder();
        }
        else {
            this.trigger("preview", this);
        }
    },
});