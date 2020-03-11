Cypress.Commands.add('injectAxe', () => {
  cy.window({ log: false }).then(window => {
    const axe = require('axe-core')
    window.eval(axe.source)
  })
})

Cypress.Commands.add('configureAxe', (configurationOptions = {}) => {
  cy.window({ log: false }).then(win => {
    return win.axe.configure(configurationOptions)
  })
})

Cypress.Commands.add('checkA11y', (
  context=undefined, 
  options=undefined, 
  violationCallback=undefined, 
  filter=['minor', 'moderate', 'serious', 'critical']
) => {
  cy.window({log: false}).then(win => {
    return win.axe.run(
      (!context)?win.document:context,
      options
    )
  }).then(({violations}) => {
    cy.wrap(0, {log: false}).as('violationCounter')
    if (violations.length) {
      if (violationCallback) {violationCallback(violations)}
      cy.wrap(violations, {log: false}).each(v => {
        cy.wrap(v.nodes, {log: false}).each(node => {
          if(filter.includes(v.impact)) {
            cy.get(node.target[0], {log: false}).then(element => element.css('border', '1px solid magenta'))
            cy.log('**Accessibility violation:**')
            cy.log(`* Rule-ID: ${v.id}`)
            cy.log(`* Impact: ${v.impact}`)
            cy.log(`* Description: ${v.description}`)
            cy.log(`* Help: [${v.help}](${v.helpUrl})`)
            cy.log(`* WCAG tags: ${v.tags.join(', ')}`)
            cy.get('@violationCounter', {log: false}).then(counter => {return counter+1}).as('violationCounter')
          }
        })
      })
    }
    return cy.get('@violationCounter', {log: false})
  }).then(violationsCounter => {
    assert.equal(
      violationsCounter,
      0,
      `Accessibility violation${violationsCounter === 1 ? '' : 's'} detected`
    )
  })
})