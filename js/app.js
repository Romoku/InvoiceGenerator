function ViewModel() {
    this.entries = [];
}

var app = angular.module('App', ['xeditable', 'ab-base64']);

(function (module) {

    var fileReader = function ($q, $log) {
 
        var onLoad = function(reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.resolve(reader.result);
                });
            };
        };
 
        var onError = function (reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.reject(reader.result);
                });
            };
        };
 
        var onProgress = function(reader, scope) {
            return function (event) {
                scope.$broadcast("fileProgress",
                    {
                        total: event.total,
                        loaded: event.loaded
                    });
            };
        };
 
        var getReader = function(deferred, scope) {
            var reader = new FileReader();
            reader.onload = onLoad(reader, deferred, scope);
            reader.onerror = onError(reader, deferred, scope);
            reader.onprogress = onProgress(reader, scope);
            return reader;
        };
 
        var readAsDataURL = function (file, scope) {
            var deferred = $q.defer();
             
            var reader = getReader(deferred, scope);         
            reader.readAsDataURL(file);
             
            return deferred.promise;
        };
 
        return {
            readAsDataUrl: readAsDataURL  
        };
    };
 
    module.factory("fileReader",
                   ["$q", "$log", fileReader]);
 
}(angular.module("App")));

app.run(function(editableOptions) {
  editableOptions.theme = 'bs3';
});

app.directive('ngFileSelect', function() {
    return {
        link: function($scope, el) {
            el.bind('change', function(e) {
                $scope.file = (e.srcElement || e.target).files[0];
                $scope.getFile();
            })
        }
    };
});

app.directive('inverted', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(val) { return !val; });
      ngModel.$formatters.push(function(val) { return !val; });
    }
  };
});

app.controller('MainCtrl', function($scope, base64, fileReader) {
    $scope.model = new ViewModel();
    $scope.model.total = 0;
    
    function total() {
        var totalNumber = 0;

        for(var i = 0; i < $scope.model.entries.length; i++) {
            totalNumber = totalNumber + $scope.model.entries[i].hours * $scope.model.entries[i].rate;
        }

        return totalNumber;
    }

    function recalculateTotal() {
        $scope.model.total = total();
    }

    $scope.addEntry = function() {
        $scope.inserted = {
          id: $scope.model.entries.length+1,
          description: '',
          hours: 0,
          rate: 0
        };

        $scope.model.entries.push($scope.inserted);
    };

    $scope.removeEntry = function(index) {
        $scope.model.entries.splice(index, 1);
    };

    $scope.recalculateTotal = recalculateTotal;

    $scope.getBlob = function() {
        var json = angular.toJson($scope.model);
        return new Blob([json], {type: "application/json"});
    };

    function createUrl () {
        var json = angular.toJson($scope.model);
        var url = URL.createObjectURL(new Blob([json], {type: "application/json"}));
        return url;
    };

    $scope.generateLink = function() {
        var href = createUrl();
        angular.element(document.querySelector('#downloadLink')).attr('href', href);
        $scope.linkGenerated = true;
    };

    $scope.getFile = function() {
        fileReader.readAsDataUrl($scope.file, $scope)
                        .then(function(result) {
                            var data = result.slice(result.indexOf(',') + 1)
                            console.log(data);
                            $scope.model = angular.fromJson(base64.decode(data));
                        });
    }
});