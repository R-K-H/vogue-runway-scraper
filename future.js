
function DiffObjects(o1, o2) {
    // choose a map() impl.
    // you may use $.map from jQuery if you wish
    var map = Array.prototype.map?
        function(a) { return Array.prototype.map.apply(a, Array.prototype.slice.call(arguments, 1)); } :
        function(a, f) { 
            var ret = new Array(a.length), value;
            for ( var i = 0, length = a.length; i < length; i++ ) 
                ret[i] = f(a[i], i);
            return ret.concat();
        };

    // shorthand for push impl.
    var push = Array.prototype.push;

    // check for null/undefined values
    if ((o1 == null) || (o2 == null)) {
        if (o1 != o2)
            return [["", "null", o1!=null, o2!=null]];

        return undefined; // both null
    }
    // compare types
    if ((o1.constructor != o2.constructor) ||
        (typeof o1 != typeof o2)) {
        return [["", "type", Object.prototype.toString.call(o1), Object.prototype.toString.call(o2) ]]; // different type

    }

    // compare arrays
    if (Object.prototype.toString.call(o1) == "[object Array]") {
        if (o1.length != o2.length) { 
            return [["", "length", o1.length, o2.length]]; // different length
        }
        var diff =[];
        for (var i=0; i<o1.length; i++) {
            // per element nested diff
            var innerDiff = DiffObjects(o1[i], o2[i]);
            if (innerDiff) { // o1[i] != o2[i]
                // merge diff array into parent's while including parent object name ([i])
                push.apply(diff, map(innerDiff, function(o, j) { o[0]="[" + i + "]" + o[0]; return o; }));
            }
        }
        // if any differences were found, return them
        if (diff.length)
            return diff;
        // return nothing if arrays equal
        return undefined;
    }

    // compare object trees
    if (Object.prototype.toString.call(o1) == "[object Object]") {
        var diff =[];
        // check all props in o1
        for (var prop in o1) {
            // the double check in o1 is because in V8 objects remember keys set to undefined 
            if ((typeof o2[prop] == "undefined") && (typeof o1[prop] != "undefined")) {
                // prop exists in o1 but not in o2
                diff.push(["[" + prop + "]", "undefined", o1[prop], undefined]); // prop exists in o1 but not in o2

            }
            else {
                // per element nested diff
                var innerDiff = DiffObjects(o1[prop], o2[prop]);
                if (innerDiff) { // o1[prop] != o2[prop]
                    // merge diff array into parent's while including parent object name ([prop])
                    push.apply(diff, map(innerDiff, function(o, j) { o[0]="[" + prop + "]" + o[0]; return o; }));
                }

            }
        }
        for (var prop in o2) {
            // the double check in o2 is because in V8 objects remember keys set to undefined 
            if ((typeof o1[prop] == "undefined") && (typeof o2[prop] != "undefined")) {
                // prop exists in o2 but not in o1
                diff.push(["[" + prop + "]", "undefined", undefined, o2[prop]]); // prop exists in o2 but not in o1

            }
        }
        // if any differences were found, return them
        if (diff.length)
            return diff;
        // return nothing if objects equal
        return undefined;
    }
    // if same type and not null or objects or arrays
    // perform primitive value comparison
    if (o1 != o2)
        return [["", "value", o1, o2]];

    // return nothing if values are equal
    return undefined;
}


const compareFolderImageCountToLookCount = (folderCount, lookCount) => {
	folderCount.sort(function(a,b){
	    return (Object.keys(a)[0] > Object.keys(b)[0]) - 0.5;
	});
	console.log(JSON.stringify(folderCount));
}
