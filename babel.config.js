module.exports = {
    "plugins": [
        "syntax-dynamic-import",
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-proposal-private-methods"
    ],
    "presets": [
        [
            "@babel/preset-env",
            {
                "modules": false
            }
        ]
    ]
}
