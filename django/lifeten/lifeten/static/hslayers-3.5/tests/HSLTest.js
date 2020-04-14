/**
 * HSLTest is a fake class, which can be used for running tests code
 * snipplets (suitable for Test.AnotherWay) without modifications
 */

var HSLTest = OpenLayers.Class({

    number: 0,

    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
    },

    run:function() {
        var tests = [];
        for (var k in window) {
            if (k.search("test_") === 0 && typeof(window[k]) == "function") {
                tests.push(window[k]);
                window[k](this);
            }
        }

        if (tests.length != this.number) {
            console.warn("Number performed tests did not match");
        }
    },
    

    plan: function (nr) {
        this.number = nr;
    },
    
    wait_result: function(time) {
        window.setTimeout(function(){console.log("End of pause");}, time*1000);
    },

    eq: function(expected,real,description) {
        if (expected == real) {
            console.log(expected == real, description);
        }
        else {
            console.warn(expected == real, "Should be equal",description);
        }
    },

    ok: function(val,description) {
        if (val) {
            console.log(val, description);
        }
        else {
            console.warn(val, "Should be true",description);
        }
    },

    CLASS_NAME: "HSLTest"
});



if (!window.name) {
    window.onload=function() {
        var t = new HSLTest();
        t.run();
    }
}
